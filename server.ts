import 'dotenv/config';
import express from 'express';
import { spawn } from 'child_process';
import os from 'os';
// ---- Aigameria Social Club (Petros-connection) backend engines ----
import { LocalNodeStore } from './src/server/connection/personal-server/localStore';
import { P2PSignalingServer } from './src/server/connection/p2p/signalingServer';
import { LanDiscoveryService } from './src/server/connection/p2p/lanDiscovery';
import { LocalStreamEngine } from './src/server/connection/streaming/streamEngine';
import { PersonalNodeController } from './src/server/connection/personal-server/nodeController';
import { createPersonalNodeRouter } from './src/server/connection/personal-server/nodeRouter';
import { TelegramBotBridge } from './src/server/connection/telegram-bot/botBridge';
import {
  CatboxProvider,
  EphemeralLanMemoryProvider,
  EphemeralRamStore,
  GitHubReleasesProvider,
  IpfsPinningProvider,
  LitterboxProvider,
  TmpfilesProvider,
} from './src/server/connection/cloud-uploader/providers';
import { CloudUploadPipeline } from './src/server/connection/cloud-uploader/uploadPipeline';
import { createLinkAndUploadRouters } from './src/server/connection/link-router/router';
import { createStreamRouter } from './src/server/connection/streaming/streamRouter';
import { startClubSimulation } from './src/server/connection/clubSimulation';
import { triLayerQuery } from './src/agents/triLayerQuery';
import { detectGameAmbiguity } from './src/agents/gameAmbiguity';
import type { LobbyGameId } from './src/utils/lobbySkillCatalog';
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import {
  runCoachSymbioteAgent,
  runCoachSymbioteAgentLive,
  runHighCourtProsecutorAgent,
  runHighlightCopyAgent,
  runScoreboardVisionAgent,
  runTacticalDrillAgent,
} from './src/agents/internalAgents.ts';
import { buildCoachSession } from './src/agents/coachSession.ts';
import { INITIAL_ECOSYSTEM_STATE } from './src/data/seedData.ts';
import type {
  ChaosTournament,
  EcosystemState,
  EscrowContract,
  HighCourtCase,
  MatchRecord,
  SupportedGame,
} from './src/types/aipetros.ts';
import {
  advanceEscrowMilestone,
  applyChessRatingsToDNA,
  castJuryVote,
  claimMissionReward,
  computeDeterministicProofId,
  deriveAvatarTier,
  markMissionProgress,
} from './src/utils/aipetrosRules.ts';
import { resolveCoachTopic } from './src/utils/coachSearchRules.ts';
import { runAdkMultiAgentConsultation } from './src/agents/adkCoachSystem.ts';
import {
  COACH_GAME_ORDER,
  fetchRealGameMediaBundle,
  normalizeCoachGameId,
  searchAllPcGames,
  syncLatestGameMeta,
} from './src/services/liveMetaSyncService.ts';
import { discoverRealCoachClips } from './src/services/realClipAgentService.ts';
import { getOrSetEightHourCache, makeCacheKey } from './src/server/eightHourCache';
import { runProClipAnalyzerAgent } from './src/agents/proClipAnalyzerAgent.ts';
import { runMotionCoachAgent } from './src/agents/motionCoachAgent.ts';
import {
  type HologramPersonaContext,
  runHologramLiveAgent,
} from './src/agents/hologramLiveAgent.ts';
import type { RealmId } from './src/types/spatial.ts';
import {
  extractKhinsiderMp3Url,
  MAX_PAYNE_DIRECT_MP3_FALLBACK_URL,
  MAX_PAYNE_KHINSIDER_PAGE_URL,
  parseByteRangeHeader,
} from './src/utils/khinsiderTrackResolver.ts';
import { getDb, dbHealth, logSecurityEvent } from './src/server/db';
import { getEcosystemState, mutateEcosystemState } from './src/server/stateStore';
import { cacheInvalidateTag } from './src/server/cache';
import {
  asyncRoute,
  corsGuard,
  requestContext,
  securityHeaders,
} from './src/server/security';
import { optionalAuth } from './src/server/auth';
import { apiV1 } from './src/server/api';
import { setupChatWebSocket, chatPresenceCount } from './src/server/chatWs';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'aipetros-state.json');
const PUBLIC_MEDIA_DIR = path.resolve(process.cwd(), 'public/media');

function loadState(): EcosystemState {
  return getEcosystemState();
}

function saveState(next: EcosystemState): void {
  mutateEcosystemState(() => ({ state: next, result: null }));
}

let state: EcosystemState = loadState();

function resolveImageToBuffer(imageInput: string): { mimeType: string; buffer: Buffer } {
  if (imageInput.startsWith('data:')) {
    const match = imageInput.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid base64 data URL image payload.');
    }
    return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
  }

  if (imageInput.startsWith('/src/assets/images/')) {
    const safeRel = path.normalize(imageInput).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^\/+/, '');
    const fullPath = path.resolve(process.cwd(), safeRel);
    const allowedRoot = path.resolve(process.cwd(), 'src/assets/images');
    if (!fullPath.startsWith(allowedRoot) || !fs.existsSync(fullPath)) {
      throw new Error('Referenced local image asset was not found.');
    }
    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    return { mimeType, buffer };
  }

  throw new Error('Unsupported image format. Upload a PNG/JPEG or select a sample capture.');
}

async function startServer() {
  const app = express();
  app.set('trust proxy', false); // socket address only — no header spoofing
  app.disable('x-powered-by');

  // Production security stack
  const corsOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  app.use(requestContext);
  app.use(securityHeaders);
  app.use(corsGuard(corsOrigins));
  app.use(optionalAuth);
  app.use(express.json({ limit: '12mb' }));

  // Versioned REST API v1 + top-level health check
  app.use('/api/v1', apiV1);
  app.get('/health', (_req, res) => {
    const db = dbHealth();
    res.json({
      status: db.ok ? 'healthy' : 'degraded',
      service: 'aipetros',
      version: '1.0.0',
      uptimeSeconds: Math.round(process.uptime()),
      database: db,
      wsPresence: chatPresenceCount(),
    });
  });

  // Neural TTS proxy — rany2/edge-tts (Microsoft Edge neural voices, free &
  // keyless). Persists MP3s to a temp dir so each text plays instantly after
  // the first request. Only the coach uses this.
  const ttsCacheDir = path.join(os.tmpdir(), 'aipetros-tts');
  if (!fs.existsSync(ttsCacheDir)) fs.mkdirSync(ttsCacheDir, { recursive: true });
  app.get('/api/tts', async (req, res) => {
    try {
      const text = String(req.query.text ?? '').slice(0, 900).trim();
      const lang = String(req.query.lang ?? 'en').toLowerCase().slice(0, 2);
      if (!text || text.length < 2) return res.status(400).json({ error: 'text required' });
      // Persona voices: Ferguson-style deep male for the sports coach.
      const voice = String(req.query.voice ?? '') || (lang === 'fa'
        ? 'fa-IR-FaridNeural'
        : 'en-US-ChristopherNeural');
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha1').update(`${voice}:${text}`).digest('hex');
      const file = path.join(ttsCacheDir, `${hash}.mp3`);
      if (!fs.existsSync(file)) {
        await new Promise<void>((resolve, reject) => {
          const proc = spawn('edge-tts', ['--voice', voice, '--text', text, '--write-media', file]);
          let stderr = '';
          proc.stderr?.on('data', (d) => { stderr += String(d); });
          proc.on('error', (err) => reject(err));
          proc.on('close', (code) => (code === 0 && fs.existsSync(file)) ? resolve() : reject(new Error(`edge-tts exited ${code}: ${stderr.slice(0, 200)}`)));
          setTimeout(() => reject(new Error('edge-tts timeout')), 20000).unref?.();
        });
      }
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      fs.createReadStream(file).pipe(res);
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'tts failed' });
    }
  });

  // Fast health probe route (legacy path kept for UI compatibility)
  // Free keyless translation proxy (Google gtx endpoint) for coach tips.
  // Persian-first UI: any English coach tip is translated on demand and cached
  // in memory so the same tip never hits the network twice.
  const translateCache = new Map<string, string>();
  app.get('/api/translate', async (req, res) => {
    const q = String(req.query.q ?? '').slice(0, 600);
    const to = String(req.query.to ?? 'fa') === 'en' ? 'en' : 'fa';
    if (!q.trim()) { res.json({ ok: false }); return; }
    const cacheKey = to + ':' + q;
    const cached = translateCache.get(cacheKey);
    if (cached) { res.json({ ok: true, text: cached }); return; }
    let translated = '';
    try {
      // primary: MyMemory (free, keyless)
      const mm = await fetch(
        'https://api.mymemory.translated.net/get?langpair=en|' + to + '&q=' + encodeURIComponent(q),
        { headers: { 'User-Agent': 'AIPETROS-Translate/1.0' }, signal: AbortSignal.timeout(6000) }
      );
      if (!mm.ok) throw new Error('mymemory ' + mm.status);
      const mmData = (await mm.json()) as { responseData?: { translatedText?: string } };
      const mmText = mmData.responseData?.translatedText ?? '';
      if (mmText.trim() && !/MYMEMORY WARNING/i.test(mmText)) translated = mmText;
    } catch {
      // fall through
    }
    if (!translated) {
      try {
        // secondary: Google gtx (free, keyless; works from many networks)
        const g = await fetch(
          'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + to + '&dt=t&q=' + encodeURIComponent(q),
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0' }, signal: AbortSignal.timeout(6000) }
        );
        if (!g.ok) throw new Error('gtx ' + g.status);
        const gData = (await g.json()) as [Array<[string, string, ...unknown[]]>, ...unknown[]];
        const gText = (gData[0] ?? []).map((part) => (part && part[0]) || '').join('');
        if (gText.trim()) translated = gText;
      } catch {
        // fall through
      }
    }
    if (!translated.trim()) { res.status(502).json({ ok: false }); return; }
    translateCache.set(cacheKey, translated);
    if (translateCache.size > 500) translateCache.clear();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, text: translated });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: dbHealth().ok });
  });

  // Phone self-diagnostic: tiny no-dependency page the user can open on any
  // device to see exactly why the app «shows nothing» (webgl/js/cdn/network)
  app.get('/diag', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AIPETROS — تست گوشی</title>
<style>body{font-family:Tahoma,sans-serif;background:#0b0f17;color:#e2e8f0;padding:20px;line-height:2}
.ok{color:#34d399}.bad{color:#f87171}li{margin:8px 0}</style></head><body>
<h2>🩺 تست اتصال گوشی به AIPETROS</h2><ul id="r"><li>⏳ در حال تست…</li></ul>
<script>
function tryWebGL(){try{const c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')))}catch(e){return false}}
(async()=>{const rows=[];const add=(ok,txt)=>rows.push('<li class="'+(ok?'ok':'bad')+'">'+(ok?'✅':'❌')+' '+txt+'</li>');
add(true,'اتصال به سرور برقراره (این صفحه از خود سرور اومد)');
add('fetch' in window,'fetch پشتیبانی می‌شه');
add(tryWebGL(),'WebGL '+(tryWebGL()?'فعاله (سه‌بعدی باید کار کنه)':'پشتیبانی نمی‌شه ← با Chrome باز کن'));
const t0=Date.now();let js='ok';
try{const r=await fetch('/assets/'+(document.querySelector('link[rel=modulepreload]')?'x':'x'));}catch(e){js=String(e).slice(0,60)}
let bundle='?';
try{const res=await fetch('/index.html');bundle=res.ok?'OK':'HTTP '+res.status}catch(e){bundle=String(e).slice(0,60)}
add(bundle==='OK','صفحه اصلی قابل دریافت است ('+bundle+' · '+(Date.now()-t0)+'ms)');
document.getElementById('r').innerHTML=rows.join('');
})();
</script></body></html>`);
  });

  // Serve generated assets and user-dropped /media (.mp4 / .glb) cleanly
  // Skip Vite dev module queries (?import / ?url) so Vite can transform ES asset imports if used
  const srcAssetsStatic = express.static(path.resolve(process.cwd(), 'src/assets'));
  app.use('/src/assets', (req, res, next) => {
    if ('import' in req.query || 'url' in req.query || 'raw' in req.query) {
      return next();
    }
    return srcAssetsStatic(req, res, next);
  });
  app.use('/media', express.static(PUBLIC_MEDIA_DIR));

  // Always serve the latest public/fc27-stadium.mp4 directly (supports byte-range scrubbing & instant replacement)
  const FC27_STADIUM_MP4 = path.resolve(process.cwd(), 'public/fc27-stadium.mp4');
  app.get('/fc27-stadium.mp4', (_req, res, next) => {
    if (!fs.existsSync(FC27_STADIUM_MP4)) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(FC27_STADIUM_MP4);
  });

  // Upload & persist user's own FC 27 turntable .mp4 directly to public/fc27-stadium.mp4
  app.post(
    '/api/media/fc27-stadium',
    express.raw({
      type: ['video/mp4', 'video/quicktime', 'video/webm', 'application/octet-stream'],
      limit: '80mb',
    }),
    (req, res) => {
      try {
        const buf = req.body;
        if (!Buffer.isBuffer(buf) || buf.length < 1024) {
          return res.status(400).json({ error: 'فایل ویدیویی معتبر ارسال نشده است.' });
        }
        fs.mkdirSync(path.dirname(FC27_STADIUM_MP4), { recursive: true });
        fs.writeFileSync(FC27_STADIUM_MP4, buf);
        const distMp4 = path.resolve(process.cwd(), 'dist/fc27-stadium.mp4');
        if (fs.existsSync(path.dirname(distMp4))) {
          fs.writeFileSync(distMp4, buf);
        }
        return res.json({
          ok: true,
          bytes: buf.length,
          src: `/fc27-stadium.mp4?v=${Date.now()}`,
        });
      } catch (err) {
        return res.status(500).json({
          error: err instanceof Error ? err.message : 'ذخیره ویدیو با خطا مواجه شد.',
        });
      }
    }
  );

  // Media presence manifest so client activates /media/lobby-bg.mp4 & coach/avatar .glb files cleanly without 404 console errors
  app.get('/api/media/manifest', (_req, res) => {
    const hasLobbyVideo = fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'lobby-bg.mp4'));
    const hasAvatarGlb = fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'avatar.glb'));
    const coachGlbs = {
      shooter: fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'coach-shooter.glb')) ? '/media/coach-shooter.glb' : null,
      sports: fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'coach-sports.glb')) ? '/media/coach-sports.glb' : null,
      strategy: fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'coach-strategy.glb')) ? '/media/coach-strategy.glb' : null,
      story: fs.existsSync(path.join(PUBLIC_MEDIA_DIR, 'coach-story.glb')) ? '/media/coach-story.glb' : null,
    };
    res.json({
      lobbyVideoUrl: hasLobbyVideo ? '/media/lobby-bg.mp4' : null,
      avatarGlbUrl: hasAvatarGlb ? '/media/avatar.glb' : null,
      coachGlbs,
    });
  });

  // 1. Read full ecosystem state
  app.get('/api/state', (_req, res) => {
    res.json(state);
  });

  // 2. Sync live Chess.com or Lichess player profile via real public API
  app.post('/api/telemetry/chess', async (req, res) => {
    try {
      const provider = req.body?.provider === 'lichess' ? 'lichess' : 'chesscom';
      const rawUsername = String(req.body?.username ?? '').trim();
      if (!rawUsername) {
        return res.status(400).json({ error: 'Please provide a valid Chess.com or Lichess username.' });
      }
      const username = encodeURIComponent(rawUsername.toLowerCase());

      let rapidRating = 1500;
      let blitzRating = 1480;
      let displayHandle = rawUsername;
      let recentMatches: MatchRecord[] = [];

      if (provider === 'chesscom') {
        const statsResp = await fetch(`https://api.chess.com/pub/player/${username}/stats`, {
          headers: { 'User-Agent': 'AIPETROS/1.0 (https://aipetros.app)' },
        });
        if (!statsResp.ok) {
          return res.status(statsResp.status === 404 ? 404 : 502).json({
            error:
              statsResp.status === 404
                ? `Chess.com player "${rawUsername}" was not found.`
                : `Chess.com API returned status ${statsResp.status}.`,
          });
        }
        const statsData = (await statsResp.json()) as {
          chess_rapid?: { last?: { rating?: number } };
          chess_blitz?: { last?: { rating?: number } };
        };
        rapidRating = statsData.chess_rapid?.last?.rating ?? 1500;
        blitzRating = statsData.chess_blitz?.last?.rating ?? 1480;

        // Fetch latest monthly archives if available
        const archivesResp = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`, {
          headers: { 'User-Agent': 'AIPETROS/1.0' },
        });
        if (archivesResp.ok) {
          const archData = (await archivesResp.json()) as { archives?: string[] };
          const latestUrl = archData.archives?.at(-1);
          if (latestUrl) {
            const gamesResp = await fetch(latestUrl, {
              headers: { 'User-Agent': 'AIPETROS/1.0' },
            });
            if (gamesResp.ok) {
              const gamesData = (await gamesResp.json()) as {
                games?: Array<{
                  white?: { username?: string; result?: string; rating?: number };
                  black?: { username?: string; result?: string; rating?: number };
                  time_class?: string;
                  end_time?: number;
                }>;
              };
              const lastTwo = (gamesData.games ?? []).slice(-2).reverse();
              recentMatches = lastTwo.map((g, idx) => {
                const isWhite = (g.white?.username ?? '').toLowerCase() === rawUsername.toLowerCase();
                const userSide = isWhite ? g.white : g.black;
                const oppSide = isWhite ? g.black : g.white;
                const result =
                  userSide?.result === 'win'
                    ? 'win'
                    : userSide?.result === 'agreed' ||
                        userSide?.result === 'stalemate' ||
                        userSide?.result === 'repetition'
                      ? 'draw'
                      : 'loss';
                return {
                  id: `chesscom-${Date.now()}-${idx}`,
                  game: 'Chess',
                  opponent: oppSide?.username ?? 'Chess.com Opponent',
                  result,
                  scoreDisplay: result === 'win' ? '1 - 0' : result === 'draw' ? '½ - ½' : '0 - 1',
                  metricsSummary: `${(g.time_class ?? 'rapid').toUpperCase()} · Opp ${oppSide?.rating ?? '?'} · Verified Chess.com API`,
                  verificationStatus: 'verified_api',
                  c2paSigned: true,
                  proofHash: computeDeterministicProofId(`${rawUsername}-${g.end_time ?? idx}`),
                  timestamp: 'Synced via Chess.com API',
                };
              });
            }
          }
        }
      } else {
        const lichessResp = await fetch(`https://lichess.org/api/user/${username}`, {
          headers: { Accept: 'application/json' },
        });
        if (!lichessResp.ok) {
          return res.status(lichessResp.status === 404 ? 404 : 502).json({
            error:
              lichessResp.status === 404
                ? `Lichess player "${rawUsername}" was not found.`
                : `Lichess API returned status ${lichessResp.status}.`,
          });
        }
        const lichessData = (await lichessResp.json()) as {
          username?: string;
          perfs?: { rapid?: { rating?: number }; blitz?: { rating?: number } };
        };
        displayHandle = lichessData.username ?? rawUsername;
        rapidRating = lichessData.perfs?.rapid?.rating ?? 1500;
        blitzRating = lichessData.perfs?.blitz?.rating ?? 1480;
      }

      // Update linked account + Skill DNA
      const nextDNA = applyChessRatingsToDNA(state.profile.skillDNA, rapidRating, blitzRating);
      const updatedAccounts = state.profile.linkedAccounts.map((acc) =>
        acc.game === 'Chess'
          ? {
              ...acc,
              handle: displayHandle,
              platform: provider === 'chesscom' ? 'Chess.com Public API' : 'Lichess Public API',
              ratingValue: `${rapidRating} · ${blitzRating}`,
              lastSyncedAt: 'Just now',
            }
          : acc
      );

      state = {
        ...state,
        profile: {
          ...state.profile,
          skillDNA: nextDNA,
          linkedAccounts: updatedAccounts,
          wallet: {
            ...state.profile.wallet,
            xp: state.profile.wallet.xp + 75,
          },
        },
        matches: [...recentMatches, ...state.matches].slice(0, 14),
      };
      saveState(state);

      res.json({
        syncedHandle: displayHandle,
        provider,
        rapidRating,
        blitzRating,
        state,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to sync Chess telemetry.',
      });
    }
  });

  // 3. Internal Vision & Integrity Agent: Inspect scoreboard screenshot locally
  app.post('/api/ai/extract-match', (req, res) => {
    try {
      const imageInput = String(req.body?.image ?? '');
      const game = String(req.body?.game ?? 'EA SPORTS FC Pro Clubs') as SupportedGame;
      if (!imageInput) {
        return res.status(400).json({ error: 'Screenshot image is required for scoreboard inspection.' });
      }

      const { mimeType, buffer } = resolveImageToBuffer(imageInput);
      const parsed = runScoreboardVisionAgent({
        buffer,
        mimeType,
        game,
        imageRef: imageInput,
        clubName: state.profile.clubName,
      });

      if (!parsed.tamperingSuspected) {
        state = {
          ...state,
          profile: {
            ...state.profile,
            missions: markMissionProgress(state.profile.missions, 'm-1'),
          },
        };
        saveState(state);
      }

      res.json({ ...parsed, state });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal scoreboard agent failed.';
      res.status(500).json({ error: message });
    }
  });

  // 4. Submit match with C2PA proof hash -> goes to Opponent Captain Verification Queue
  app.post('/api/matches', (req, res) => {
    const {
      game = 'EA SPORTS FC Pro Clubs',
      opponent = 'Madrid Titans',
      result = 'win',
      scoreDisplay = '3 - 1',
      metricsSummary = '58% Poss · 89% Pass · 2.4 xG',
      screenshotUrl,
      aiConfidence = 96,
      territoryId,
    } = req.body ?? {};

    if (!String(opponent).trim() || !String(scoreDisplay).trim()) {
      return res.status(400).json({ error: 'Opponent club and scoreline are required.' });
    }

    const newMatch: MatchRecord = {
      id: `match-${Date.now()}`,
      game,
      opponent: String(opponent).trim(),
      result,
      scoreDisplay: String(scoreDisplay).trim(),
      metricsSummary: String(metricsSummary).trim(),
      verificationStatus: 'pending_captain',
      c2paSigned: Boolean(screenshotUrl),
      proofHash: computeDeterministicProofId(`${opponent}-${scoreDisplay}-${Date.now()}`),
      screenshotUrl,
      aiConfidence,
      timestamp: 'Just now · Awaiting Captain',
      territoryId,
    };

    state = {
      ...state,
      profile: {
        ...state.profile,
        missions: markMissionProgress(state.profile.missions, 'm-1'),
      },
      matches: [newMatch, ...state.matches],
    };
    saveState(state);
    res.json({ match: newMatch, state });
  });

  // 5. Opponent Captain Decision: Approve (updates Wallet, Territory, Escrow) OR Dispute (opens High Court Case)
  app.post('/api/matches/:id/captain-decision', (req, res) => {
    const { id } = req.params;
    const decision = req.body?.decision === 'dispute' ? 'dispute' : 'approve';
    const target = state.matches.find((m) => m.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Match record not found.' });
    }

    if (decision === 'approve') {
      const updatedMatches = state.matches.map((m) =>
        m.id === id
          ? { ...m, verificationStatus: 'verified_dual' as const, timestamp: 'Verified · Dual Proof' }
          : m
      );

      let nextWallet = {
        ...state.profile.wallet,
        xp: state.profile.wallet.xp + (target.result === 'win' ? 350 : 120),
        platformPoints: state.profile.wallet.platformPoints + (target.result === 'win' ? 180 : 40),
        reputation: Math.min(1000, state.profile.wallet.reputation + 8),
      };

      // Advance any active escrow if win
      let updatedEscrows = state.escrows;
      if (target.result === 'win') {
        updatedEscrows = state.escrows.map((esc) => {
          if (esc.status === 'active_locked' && esc.game === target.game) {
            const adv = advanceEscrowMilestone(esc, nextWallet);
            nextWallet = adv.wallet;
            return adv.contract;
          }
          return esc;
        });
      }

      // Flip territory if linked & win
      let updatedTerritories = state.territories;
      if (target.territoryId && target.result === 'win') {
        updatedTerritories = state.territories.map((t) =>
          t.id === target.territoryId
            ? {
                ...t,
                controllingClub: state.profile.clubName,
                controllingTag: state.profile.clubTag,
                colorHex: '#38bdf8',
                defenseStrength: Math.min(99, t.defenseStrength + 4),
              }
            : t
        );
      }

      // Complete mission m-1 if territory matched
      const updatedMissions = state.profile.missions.map((ms) => {
        if (ms.id === 'm-1' && target.result === 'win' && !ms.completed) {
          nextWallet.xp += ms.rewardXp;
          nextWallet.platformPoints += ms.rewardPoints;
          return { ...ms, progress: ms.target, completed: true };
        }
        return ms;
      });

      state = {
        ...state,
        profile: {
          ...state.profile,
          avatarTier: deriveAvatarTier(nextWallet.reputation),
          wallet: nextWallet,
          missions: updatedMissions,
        },
        matches: updatedMatches,
        escrows: updatedEscrows,
        territories: updatedTerritories,
      };
      saveState(state);
      return res.json({ status: 'approved', state });
    }

    // Dispute -> escalate to AI-Human High Court
    const updatedMatches = state.matches.map((m) =>
      m.id === id
        ? { ...m, verificationStatus: 'disputed_court' as const, timestamp: 'Escalated to High Court' }
        : m
    );
    const newCase: HighCourtCase = {
      id: `hc-${Date.now().toString().slice(-4)}`,
      title: `${state.profile.clubName} vs. ${target.opponent} — Disputed ${target.scoreDisplay}`,
      game: target.game,
      accusedHandle: state.profile.handle,
      claimantClub: target.opponent,
      summary: `Opponent captain contested submitted ${target.game} scoreline (${target.scoreDisplay}). Proof hash ${target.proofHash} queued for AI Prosecutor & Community Jury.`,
      evidenceImageUrl: target.screenshotUrl,
      c2paStatus: target.c2paSigned ? 'Valid Hardware Sign' : 'Tampered / Missing Manifest',
      votesUphold: 0,
      votesAcquit: 1,
      quorumTarget: 10,
      status: 'open_deliberation',
    };

    state = {
      ...state,
      matches: updatedMatches,
      highCourtCases: [newCase, ...state.highCourtCases],
    };
    saveState(state);
    return res.json({ status: 'disputed', newCase, state });
  });

  // 6. Meta-World Territory Capture Challenge Action
  app.post('/api/territories/:id/capture', (req, res) => {
    const { id } = req.params;
    const territory = state.territories.find((t) => t.id === id);
    if (!territory) {
      return res.status(404).json({ error: 'Territory sector not found.' });
    }

    const updatedTerritories = state.territories.map((t) =>
      t.id === id
        ? {
            ...t,
            controllingClub: state.profile.clubName,
            controllingTag: state.profile.clubTag,
            colorHex: '#38bdf8',
            defenseStrength: Math.min(99, t.defenseStrength + 5),
          }
        : t
    );

    const nextWallet = {
      ...state.profile.wallet,
      xp: state.profile.wallet.xp + 400,
      platformPoints: state.profile.wallet.platformPoints + territory.bonusPointsPerDay,
      reputation: Math.min(1000, state.profile.wallet.reputation + 10),
    };

    const updatedMissions = state.profile.missions.map((ms) =>
      ms.id === 'm-1' && !ms.completed ? { ...ms, progress: ms.target, completed: true } : ms
    );

    state = {
      ...state,
      profile: {
        ...state.profile,
        avatarTier: deriveAvatarTier(nextWallet.reputation),
        wallet: nextWallet,
        missions: updatedMissions,
      },
      territories: updatedTerritories,
    };
    saveState(state);
    res.json({ territory: updatedTerritories.find((t) => t.id === id), state });
  });

  // 7. Create or Advance Smart Scouting Escrow
  app.post('/api/escrow', (req, res) => {
    const { playerHandle, role, game, lockedPoints, winsRequired } = req.body ?? {};
    const points = Number(lockedPoints);
    const wins = Number(winsRequired);
    if (!playerHandle || !Number.isFinite(points) || points <= 0 || !Number.isFinite(wins) || wins < 1) {
      return res.status(400).json({ error: 'Valid player handle, point stake, and win target are required.' });
    }
    if (points > state.profile.wallet.platformPoints) {
      return res.status(400).json({ error: 'Insufficient Platform Points for this Escrow contract.' });
    }

    const contract: EscrowContract = {
      id: `esc-${Date.now().toString().slice(-4)}`,
      playerHandle: String(playerHandle).trim(),
      role: String(role || 'Flex Tactician').trim(),
      clubName: state.profile.clubName,
      game: game || 'EA SPORTS FC Pro Clubs',
      lockedPoints: Math.round(points),
      winsRequired: Math.round(wins),
      winsCompleted: 0,
      status: 'active_locked',
      createdAt: 'Today',
    };

    state = {
      ...state,
      profile: {
        ...state.profile,
        wallet: {
          ...state.profile.wallet,
          platformPoints: state.profile.wallet.platformPoints - Math.round(points),
        },
      },
      escrows: [contract, ...state.escrows],
    };
    saveState(state);
    res.json({ contract, state });
  });

  app.post('/api/escrow/:id/advance', (req, res) => {
    const { id } = req.params;
    const target = state.escrows.find((e) => e.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Escrow contract not found.' });
    }
    let nextWallet = state.profile.wallet;
    let releasedNow = false;
    const updatedEscrows = state.escrows.map((e) => {
      if (e.id === id) {
        const resAdv = advanceEscrowMilestone(e, nextWallet);
        nextWallet = resAdv.wallet;
        releasedNow = resAdv.releasedNow;
        return resAdv.contract;
      }
      return e;
    });

    state = {
      ...state,
      profile: {
        ...state.profile,
        avatarTier: deriveAvatarTier(nextWallet.reputation),
        wallet: nextWallet,
      },
      escrows: updatedEscrows,
    };
    saveState(state);
    res.json({ releasedNow, state });
  });

  // 8. Join Chaos Tournament
  app.post('/api/tournaments/:id/join', (req, res) => {
    const { id } = req.params;
    const updated: ChaosTournament[] = state.tournaments.map((t) =>
      t.id === id && !t.joined
        ? { ...t, joined: true, participantsCount: Math.min(t.maxParticipants, t.participantsCount + 1) }
        : t
    );
    state = { ...state, tournaments: updated };
    saveState(state);
    res.json({ state });
  });

  // 9. Complete 10s Micro-Game Drill -> awards XP & improves Skill DNA
  app.post('/api/drills/complete', (req, res) => {
    const { mode, won } = req.body ?? {};
    const xpGain = won ? 180 : 60;
    const ptsGain = won ? 90 : 20;
    const dna = { ...state.profile.skillDNA };
    if (won) {
      if (mode === '2d-chess') {
        dna.trapAnticipation = Math.min(99, dna.trapAnticipation + 1);
        dna.endgameComposure = Math.min(99, dna.endgameComposure + 1);
      } else {
        dna.spatialPassing = Math.min(99, dna.spatialPassing + 1);
        dna.tempoControl = Math.min(99, dna.tempoControl + 1);
      }
    }

    const nextWallet = {
      ...state.profile.wallet,
      xp: state.profile.wallet.xp + xpGain,
      platformPoints: state.profile.wallet.platformPoints + ptsGain,
    };

    const updatedMissions = markMissionProgress(state.profile.missions, 'm-2');

    state = {
      ...state,
      profile: {
        ...state.profile,
        skillDNA: dna,
        wallet: nextWallet,
        missions: updatedMissions,
      },
    };
    saveState(state);
    res.json({ xpGain, ptsGain, state });
  });

  // 10. Internal Tactical Micro-Game Generator Agent
  app.post('/api/ai/microgame', (req, res) => {
    try {
      const mode = req.body?.mode === '3d-pitch' ? '3d-pitch' : '2d-chess';
      const currentDrillId = req.body?.currentDrillId ? String(req.body.currentDrillId) : undefined;
      const drill = runTacticalDrillAgent({ mode, state, currentDrillId });
      res.json({ drill });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to generate tactical micro-game.',
      });
    }
  });

  // 11. High Court: Internal Forensic Prosecutor Agent + Community Jury Vote
  app.post('/api/ai/prosecutor', (req, res) => {
    try {
      const caseId = String(req.body?.caseId ?? '');
      const courtCase = state.highCourtCases.find((c) => c.id === caseId);
      if (!courtCase) {
        return res.status(404).json({ error: 'High Court case not found.' });
      }

      let evidenceBuffer: Buffer | null = null;
      let evidenceMimeType: string | undefined;
      if (courtCase.evidenceImageUrl) {
        try {
          const resolved = resolveImageToBuffer(courtCase.evidenceImageUrl);
          evidenceBuffer = resolved.buffer;
          evidenceMimeType = resolved.mimeType;
        } catch {
          evidenceBuffer = null;
        }
      }

      const brief = runHighCourtProsecutorAgent({
        courtCase,
        state,
        evidenceBuffer,
        evidenceMimeType,
      });

      state = {
        ...state,
        highCourtCases: state.highCourtCases.map((c) =>
          c.id === caseId ? { ...c, aiProsecutorBrief: brief } : c
        ),
      };
      saveState(state);
      res.json({ brief, state });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Internal forensic check failed.',
      });
    }
  });

  app.post('/api/high-court/:id/vote', (req, res) => {
    const { id } = req.params;
    const decision = req.body?.decision === 'acquit' ? 'acquit' : 'uphold';
    const target = state.highCourtCases.find((c) => c.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const updatedCase = castJuryVote(target, decision);
    let nextWallet = state.profile.wallet;
    let updatedMissions = state.profile.missions;

    // Mark Juror participation mission ready to claim
    if (!target.userVoted) {
      nextWallet = {
        ...nextWallet,
        reputation: Math.min(1000, nextWallet.reputation + 10),
      };
      updatedMissions = markMissionProgress(state.profile.missions, 'm-3');
    }

    state = {
      ...state,
      profile: {
        ...state.profile,
        avatarTier: deriveAvatarTier(nextWallet.reputation),
        wallet: nextWallet,
        missions: updatedMissions,
      },
      highCourtCases: state.highCourtCases.map((c) => (c.id === id ? updatedCase : c)),
    };
    saveState(state);
    res.json({ courtCase: updatedCase, state });
  });

  // 11b. Claim completed daily mission reward and persist to ledger
  app.post('/api/missions/:id/claim', (req, res) => {
    const { id } = req.params;
    const claimed = claimMissionReward(state.profile.missions, state.profile.wallet, id);
    if (!claimed.claimedNow) {
      return res.status(400).json({ error: 'Mission is not ready to claim or has already been claimed.' });
    }

    state = {
      ...state,
      profile: {
        ...state.profile,
        missions: claimed.missions,
        wallet: claimed.wallet,
      },
    };
    saveState(state);
    res.json({
      mission: claimed.missions.find((m) => m.id === id),
      state,
    });
  });

  // 12. Internal AI Coach Symbiote Agent — live-web powered
  app.post('/api/ai/symbiote', asyncRoute(async (req, res) => {
    const message = String(req.body?.message ?? '').trim();
    const activeSection = String(req.body?.activeSection ?? 'gamer-id');
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const gameName = String(req.body?.gameName ?? '').trim() || undefined;
    const { reply, live } = await runCoachSymbioteAgentLive({ message, activeSection, state, gameName });
    res.json({ reply, liveSources: live.sources.length, online: live.online, tookMs: live.tookMs });
  }));

  // 13. Internal Highlight Copywriter Agent
  app.post('/api/ai/highlight-copy', (req, res) => {
    try {
      const matchId = String(req.body?.matchId ?? state.matches[0]?.id ?? '');
      const match = state.matches.find((m) => m.id === matchId) ?? state.matches[0];
      res.json(runHighlightCopyAgent({ match, clubName: state.profile.clubName }));
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to generate highlight copy.',
      });
    }
  });

  // 14. Google ADK (adk.dev) Multi-Agent Coach Consultation + Live Web Media Search
  // 14b. Fast game-choice probe: tells the UI which games a question is meaningful for
  app.get('/api/ai/game-choices', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const q = String(req.query.q ?? '').trim();
    const result = detectGameAmbiguity(q);
    return res.json({
      ambiguous: result.ambiguous,
      resolvedGameId: result.resolvedGameId,
      candidates: result.candidates,
    });
  });

  app.get('/api/coach/search', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); // live data — never let the browser serve stale answers
    try {
      const rawRealm = String(req.query.realm ?? 'shooter');
      const realm: RealmId =
        rawRealm === 'sports' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : 'shooter';
      const q = String(req.query.q ?? '').trim();
      const tapX = req.query.tapX !== undefined ? Number(req.query.tapX) : undefined;
      const tapY = req.query.tapY !== undefined ? Number(req.query.tapY) : undefined;

      const topic = await runAdkMultiAgentConsultation({
        realm,
        query: q,
        gameId: typeof req.query.gameId === 'string' ? req.query.gameId.trim() : undefined,
        tapX: Number.isFinite(tapX) ? tapX : undefined,
        tapY: Number.isFinite(tapY) ? tapY : undefined,
      });

      // Perform a fast live public web image search via Wikimedia Commons API (with 1500ms timeout & resilient local fallback)
      try {
        const searchTerm = encodeURIComponent(topic.searchQuery);
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${searchTerm}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=960&format=json&origin=*`;
        const resp = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'AIPETROS-ADK-Coach/3.0' },
          signal: AbortSignal.timeout(1500),
        });
        if (resp.ok) {
          const data = (await resp.json()) as {
            query?: {
              pages?: Record<
                string,
                { pageid?: number; title?: string; thumbnail?: { source?: string } }
              >;
            };
          };
          const pages = Object.values(data.query?.pages ?? {});
          const webImages = pages
            .filter((p) => {
              const src = (p.thumbnail?.source ?? '').toLowerCase();
              return Boolean(src) && !src.includes('.pdf') && !src.includes('.svg');
            })
            .map((p, idx) => ({
              id: `web-img-${p.pageid ?? idx}`,
              title: `${topic.titleFa} · ${p.title ?? 'Web Tactical Capture'}`,
              imageUrl: String(p.thumbnail?.source),
              fallbackUrl: topic.images[0]?.fallbackUrl ?? '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
              sourceLabel: 'Internet Search · Live Web',
            }));
          if (webImages.length > 0) {
            topic.images = [...topic.images.slice(0, 1), ...webImages, ...topic.images.slice(1)].slice(0, 3);
          }
        }
      } catch {
        // Resilient fallback to pre-verified local tactical images
      }

      res.json({
        topic,
        gameChoices: detectGameAmbiguity(q),
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ADK Coach search failed.',
      });
    }
  });

  // 15. POST /api/adk/consult — Multimodal ADK Agent Pipeline for Uploaded Gameplay Screenshots & Deep-Dive Questions
  app.post('/api/adk/consult', async (req, res) => {
    try {
      const rawRealm = String(req.body?.realm ?? 'shooter');
      const realm: RealmId =
        rawRealm === 'sports' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : 'shooter';
      const query = String(req.body?.query ?? '').trim();
      const tapX = req.body?.tapX !== undefined ? Number(req.body.tapX) : undefined;
      const tapY = req.body?.tapY !== undefined ? Number(req.body.tapY) : undefined;
      const rawDataUrl = typeof req.body?.imageDataUrl === 'string' ? req.body.imageDataUrl : '';

      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      if (rawDataUrl.startsWith('data:image/')) {
        const match = rawDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          imageMimeType = match[1];
          imageBase64 = match[2];
        }
      }

      const topic = await runAdkMultiAgentConsultation({
        realm,
        query,
        tapX: Number.isFinite(tapX) ? tapX : undefined,
        tapY: Number.isFinite(tapY) ? tapY : undefined,
        imageBase64,
        imageMimeType,
      });

      if (rawDataUrl.startsWith('data:image/')) {
        topic.images = [
          {
            id: `up-adk-${Date.now()}`,
            title: query || 'صحنه بازی آپلود شده شما',
            imageUrl: rawDataUrl,
            fallbackUrl: topic.images[0]?.fallbackUrl ?? '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
            sourceLabel: 'ADK Vision Agent · Analyzed',
          },
          ...topic.images,
        ].slice(0, 3);
      }

      res.json({
        topic,
        gameChoices: detectGameAmbiguity(query),
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ADK multi-agent consultation failed.',
      });
    }
  });

  // 16. POST /api/social/chat — Rockstar / GTA VI Social Club Crew Radio & Direct Message Reply Agent
  app.post('/api/social/chat', (req, res) => {
    try {
      const text = String(req.body?.text ?? '').trim();
      const channelId = String(req.body?.channelId ?? 'global-vice');
      const userHandle = String(req.body?.userHandle ?? 'Vortex_IR');
      if (!text) {
        return res.status(400).json({ error: 'Message text is required.' });
      }
      const lower = text.toLowerCase();
      let senderHandle = 'parsa_vice27';
      let senderTag = 'FC27';
      let replyText = `ایول ${userHandle}! پیامتو توی رادیو کلاب وایس‌سیتی گرفتم. امشب اسکواد پرو کلابز و CS2 هر دو فعاله، آماده‌ای؟`;

      if (channelId === 'dm-g-2' || lower.includes('cs') || lower.includes('شوتر') || lower.includes('ام')) {
        senderHandle = 'nima_headshot';
        senderTag = 'SAS';
        replyText = `حله ${userHandle}! من توی لابی Mirage منتظرم. میکروفون روشنه، کانتر-استریف ۶۵ میلی‌ثانیه یادت نره!`;
      } else if (channelId === 'dm-g-3' || lower.includes('dota') || lower.includes('روشان') || lower.includes('شطرنج')) {
        senderHandle = 'artin_roshan';
        senderTag = 'DOTA';
        replyText = `ایول! تایمینگ اسموک روشان رو ست کردم. بیا توی اسکواد تا درفت رو ببندیم.`;
      } else if (channelId === 'dm-g-4' || lower.includes('gta') || lower.includes('هایست') || lower.includes('وایس')) {
        senderHandle = 'tara_outlaw';
        senderTag = 'VICE';
        replyText = `هایست پنت‌هاوس Ocean Drive آماده‌ست ${userHandle}! ماشین فرار رو آوردم جلوی کلاب، بپر بالا!`;
      }

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      res.json({
        reply: {
          id: `srv-reply-${Date.now()}`,
          channelId,
          senderHandle,
          senderTag,
          text: replyText,
          timestamp: `${hh}:${mm}`,
          isSelf: false,
          accentHex: '#FF2E93',
        },
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Social chat agent failed.',
      });
    }
  });

  // 17. Self-Updating Live Game Meta & Real Gameplay Media Routes (All PC Games across 4 Genres)
  app.get('/api/meta/live', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const force = req.query.force === '1' || req.query.force === 'true';
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;
      const steamAppId = req.query.steamAppId ? Number(req.query.steamAppId) : undefined;
      const meta = await syncLatestGameMeta(gameId, {
        force,
        
        gameName,
        realm,
        steamAppId: Number.isFinite(steamAppId) ? steamAppId : undefined,
      });
      res.json({ meta });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to load live game meta.',
      });
    }
  });

  app.post('/api/meta/sync', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.body?.gameId);
      const gameName = typeof req.body?.gameName === 'string' ? req.body.gameName.trim() : undefined;
      const rawRealm = String(req.body?.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;
      const steamAppId = req.body?.steamAppId ? Number(req.body.steamAppId) : undefined;
      const meta = await syncLatestGameMeta(gameId, {
        force: true,
        
        gameName,
        realm,
        steamAppId: Number.isFinite(steamAppId) ? steamAppId : undefined,
      });
      res.json({ meta });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to sync live game meta.',
      });
    }
  });

  // 18. Search ALL PC Games (Curated 4-Genre Catalog + Live Steam Store Search)
  app.get('/api/games/search', async (req, res) => {
    try {
      const q = String(req.query.q ?? '').trim();
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;
      const games = await searchAllPcGames(q, { realm });
      res.json({ games });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to search PC games.',
      });
    }
  });

  // 19. Fetch Real Official Gameplay Videos (HLS/MP4) & 1080p Gameplay Screenshots for ANY PC Game
  app.get('/api/games/media', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;
      const steamAppId = req.query.steamAppId ? Number(req.query.steamAppId) : undefined;
      const media = await fetchRealGameMediaBundle({
        gameId,
        gameName,
        realm,
        steamAppId: Number.isFinite(steamAppId) ? steamAppId : undefined,
      });
      res.json({ media });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to fetch real game media.',
      });
    }
  });

  // 20. Automatic Real YouTube Pro/Influencer & Reddit Gameplay Clip Discovery Agent
  app.get('/api/games/clips', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const userQuery = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
      const force = req.query.force === '1' || req.query.force === 'true';
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;

      const discovery = await discoverRealCoachClips(
        {
          gameId,
          gameName,
          realm,
          userQuery,
        },
        { force }
      );
      res.json({ discovery });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to discover real gameplay clips.',
      });
    }
  });

  // 21. Agent 1 — ProClipAnalyzerAgent (Real YouTube/Reddit Clips + 3 Scrubber Chapters)
  app.get('/api/agents/pro-clips', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const userQuery = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
      const force = req.query.force === '1' || req.query.force === 'true';
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;

      const result = await getOrSetEightHourCache(
        makeCacheKey(['pro-clips', gameId, realm, userQuery]),
        () => runProClipAnalyzerAgent({ gameId, gameName, realm, userQuery }, { force })
      );
      res.json({ ...result.data, fromCache: result.fromCache });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ProClipAnalyzerAgent failed.',
      });
    }
  });

  // 21b. Professional Coach Session — one question, one complete class (5 modules, per-module clips)
  // Real player photo — Wikipedia REST summary (keyless), 24h in-memory cache, 3s timeout.
  const PLAYER_PHOTO_CACHE = new Map<string, { photo: string | null; fetchedAtMs: number }>();
  app.get('/api/ai/player-photo', async (req, res) => {
    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    if (!name) return res.status(400).json({ error: 'name required' });
    const cached = PLAYER_PHOTO_CACHE.get(name);
    if (cached && Date.now() - cached.fetchedAtMs < 24 * 3600 * 1000) {
      return res.json({ photo: cached.photo });
    }
    let photo: string | null = null;
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 3000);
      const resp = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/\./g, ''))}`,
        { signal: ctl.signal, headers: { 'User-Agent': 'AIPETROS/1.0 (coach card)' } }
      );
      clearTimeout(timer);
      if (resp.ok) {
        const body: unknown = await resp.json();
        photo =
          (body as { thumbnail?: { source?: string }; originalimage?: { source?: string } })?.thumbnail?.source ??
          (body as { originalimage?: { source?: string } })?.originalimage?.source ??
          null;
      }
    } catch {
      photo = null;
    }
    // Fallback: Wikipedia search (handles accents like «Mbappé» → «Mbappe»)
    if (!photo) {
      try {
        const plain = name
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/['’]/g, '')
          .trim();
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(
          plain
        )}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=400`;
        const sResp = await fetch(searchUrl, {
          signal: AbortSignal.timeout(3000),
          headers: { 'User-Agent': 'AIPETROS/1.0 (coach card)' },
        });
        if (sResp.ok) {
          const sBody = (await sResp.json()) as {
            query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
          };
          const pages = Object.values(sBody.query?.pages ?? {});
          photo = pages[0]?.thumbnail?.source ?? null;
        }
      } catch {
        photo = null;
      }
    }
    PLAYER_PHOTO_CACHE.set(name, { photo, fetchedAtMs: Date.now() });
    res.json({ photo });
  });

  // Coach memory — knowledge_cards store (200+ questions, tricks, glitches per game)
  app.get('/api/ai/knowledge', async (req, res) => {
    const gameId = typeof req.query.gameId === 'string' ? req.query.gameId.trim() : '';
    const kind = typeof req.query.kind === 'string' ? req.query.kind.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    if (!gameId) return res.status(400).json({ error: 'gameId required' });
    try {
      const rows = getDb().prepare(
        `SELECT kind, title, body, source, url, updated_at FROM knowledge_cards
         WHERE game_id = ? ${kind ? "AND kind = ?" : ''}
         ORDER BY updated_at DESC LIMIT 400`
      ).all(...(kind ? [gameId, kind] : [gameId]));
      let cards = rows;
      if (q) {
        const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
        cards = cards
          .map((c) => {
            const hay = `${c.title} ${c.body}`.toLowerCase();
            let score = 0;
            for (const t of tokens) if (hay.includes(t)) score += 2;
            return { c, score };
          })
          .filter((e) => e.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
          .map((e) => ({ ...e.c, relevance: e.score }));
      }
      const stats = getDb().prepare('SELECT kind, COUNT(*) AS n FROM knowledge_cards WHERE game_id = ? GROUP BY kind').all(gameId);
      res.json({ success: true, data: { gameId, stats, cards } });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'knowledge read failed' });
    }
  });

  // World 10k Knowledge Engine — 3-layer triage: L1 normalize (fa→en + 2026 bump),
  // L2 local SQLite (FTS5 + knowledge_cards), L3 free-API web search with auto-store.
  app.get('/api/ai/knowledge-engine', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const platform = typeof req.query.platform === 'string' ? req.query.platform.trim() : '';
    const gameId = (typeof req.query.gameId === 'string' ? req.query.gameId.trim() : 'fc27') as LobbyGameId;
    if (!q) return res.status(400).json({ error: 'q required' });
    try {
      const result = await triLayerQuery(q, gameId, platform || undefined);
      res.json({
        success: true,
        data: {
          layer: result.layer,
          normalizedEn: result.normalizedEn,
          bumpedEn: result.bumpedEn,
          tookMs: result.tookMs,
          local: result.local,
          web: result.web,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'knowledge-engine failed' });
    }
  });

  app.get('/api/ai/coach-session', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const userQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : 'sports';
      const force = req.query.force === '1' || req.query.force === 'true';
      const langParam = String(req.query.lang ?? '').toLowerCase().slice(0, 2);
      const forceLang = langParam === 'fa' || langParam === 'en' ? (langParam as 'fa' | 'en') : undefined;
      const sessionCall = force
        ? { data: await buildCoachSession(
            { gameId, gameName, realm, query: userQuery },
            { state: getEcosystemState(), force, forceLang }
          ), fromCache: false }
        : await getOrSetEightHourCache(
            makeCacheKey(['coach-session', gameId, realm, userQuery, forceLang ?? 'auto']),
            () => buildCoachSession(
              { gameId, gameName, realm, query: userQuery },
              { state: getEcosystemState(), forceLang }
            )
          );
      res.json({ session: sessionCall.data, fromCache: sessionCall.fromCache });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Coach session failed.',
      });
    }
  });

  // 22. Agent 2 — MotionCoachAgent (Per-Game Animated Motion Graphics & Live Patch Coaching)
  app.get('/api/agents/motion-coach', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const force = req.query.force === '1' || req.query.force === 'true';
      const steamAppId = req.query.steamAppId ? Number(req.query.steamAppId) : undefined;
      const rawRealm = String(req.query.realm ?? '');
      const realm: RealmId | undefined =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? rawRealm
          : undefined;

      const payload = await runMotionCoachAgent(
        {
          gameId,
          gameName,
          realm,
          steamAppId: Number.isFinite(steamAppId) ? steamAppId : undefined,
        },
        {
          force,
          
        }
      );
      res.json(payload);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'MotionCoachAgent failed.',
      });
    }
  });

  // 24. 8h-cached media resolver — the projector/stage loads topic-matched
  // video URLs from the backend cache (TTL 28800s) with zero external calls
  // while fresh. Reuses the real clip agent's own 8h cache underneath.
  app.get('/api/agents/media-resolve', async (req, res) => {
    try {
      const gameId = normalizeCoachGameId(req.query.gameId);
      const gameName = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
      const userQuery = typeof req.query.topic === 'string' ? req.query.topic.trim() : '';
      const rawRealm = String(req.query.realm ?? '');
      const realm =
        rawRealm === 'sports' || rawRealm === 'shooter' || rawRealm === 'strategy' || rawRealm === 'story'
          ? (rawRealm as RealmId)
          : undefined;
      const resolveCall = await getOrSetEightHourCache(
        makeCacheKey(['media-resolve', gameId, realm, userQuery]),
        () => discoverRealCoachClips(
          { gameId, gameName, realm, userQuery },
          { force: req.query.force === '1' || req.query.force === 'true' }
        )
      );
      res.json({
        gameId,
        topic: userQuery,
        kind: 'clips',
        cachedForSeconds: 28800,
        fromCache: resolveCall.fromCache,
        clips: resolveCall.data.clips ?? [],
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'media resolve failed' });
    }
  });

  // 23. Internal Hologram Agent (deterministic dialogue + emotion/gesture + locally synthesized WAV)
  app.post('/api/hologram/interact', async (req, res) => {
    try {
      const body = req.body as {
        message?: string;
        personaContext?: Partial<HologramPersonaContext>;
        includeVoice?: boolean;
      };
      const message = String(body?.message ?? '').trim();
      if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
      }
      const p = body?.personaContext ?? {};
      const personaContext: HologramPersonaContext = {
        displayName: String(p.displayName ?? 'Kian Rostami'),
        handle: String(p.handle ?? '@kian.spatial'),
        unifiedId: String(p.unifiedId ?? 'AGM-8841-IR'),
        activeGameTitle: String(p.activeGameTitle ?? 'All Linked Titles'),
        tierLabel: String(p.tierLabel ?? 'Apex Tier II'),
        winRatePct: Number.isFinite(Number(p.winRatePct)) ? Number(p.winRatePct) : 68.4,
        tacticalConsistencyPct: Number.isFinite(Number(p.tacticalConsistencyPct))
          ? Number(p.tacticalConsistencyPct)
          : 91.2,
        competitiveRating: Number.isFinite(Number(p.competitiveRating))
          ? Number(p.competitiveRating)
          : 2480,
        verifiedMatchesCount: Number.isFinite(Number(p.verifiedMatchesCount))
          ? Number(p.verifiedMatchesCount)
          : 142,
        queuedMatchesCount: Number.isFinite(Number(p.queuedMatchesCount))
          ? Number(p.queuedMatchesCount)
          : 2,
        openDisputesCount: Number.isFinite(Number(p.openDisputesCount))
          ? Number(p.openDisputesCount)
          : 1,
        gender: p.gender === 'female' ? 'female' : 'male',
        age: Number.isFinite(Number(p.age)) ? Math.max(8, Math.min(99, Math.round(Number(p.age)))) : 36,
        matchedCharacterName: typeof p.matchedCharacterName === 'string' ? p.matchedCharacterName : undefined,
        matchedCharacterFranchise:
          typeof p.matchedCharacterFranchise === 'string' ? p.matchedCharacterFranchise : undefined,
        matchedCharacterArchetype:
          typeof p.matchedCharacterArchetype === 'string' ? p.matchedCharacterArchetype : undefined,
      };

      const result = await runHologramLiveAgent({
        message,
        personaContext,
        includeVoice: Boolean(body?.includeVoice),
      });
      return res.json(result);
    } catch (err) {
      const statusCode =
        typeof (err as { statusCode?: number })?.statusCode === 'number'
          ? (err as { statusCode: number }).statusCode
          : 500;
      return res.status(statusCode).json({
        error: err instanceof Error ? err.message : 'Hologram AI Agent request failed.',
        code: (err as { code?: string })?.code ?? 'HOLOGRAM_AGENT_ERROR',
      });
    }
  });

  // 24. Max Payne (2001) — "23. Max Theme Short.mp3" same-origin streaming endpoint (resolved from khinsider)
  let cachedMaxPayneMp3: Buffer | null = null;
  let pendingMaxPayneFetch: Promise<Buffer> | null = null;

  const downloadMp3FromUrl = async (url: string): Promise<Buffer> => {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIPETROS-Audio/1.0)',
        Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      throw new Error(`MP3 fetch failed with HTTP ${resp.status}`);
    }
    const contentType = (resp.headers.get('content-type') ?? '').toLowerCase();
    if (contentType.includes('text/html')) {
      throw new Error('Upstream returned HTML instead of audio/mpeg.');
    }
    const arrayBuf = await resp.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (buf.length < 16_384) {
      throw new Error('Downloaded MP3 payload is unexpectedly small.');
    }
    return buf;
  };

  const fetchMaxPayneThemeBuffer = async (): Promise<Buffer> => {
    if (cachedMaxPayneMp3) return cachedMaxPayneMp3;
    if (pendingMaxPayneFetch) return pendingMaxPayneFetch;

    pendingMaxPayneFetch = (async () => {
      let resolvedUrl: string | null = null;
      try {
        const pageResp = await fetch(MAX_PAYNE_KHINSIDER_PAGE_URL, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIPETROS-Audio/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        if (pageResp.ok) {
          const html = await pageResp.text();
          resolvedUrl = extractKhinsiderMp3Url(html);
        }
      } catch {
        resolvedUrl = null;
      }

      const candidates = [resolvedUrl, MAX_PAYNE_DIRECT_MP3_FALLBACK_URL].filter(
        (u, idx, arr): u is string => Boolean(u) && arr.indexOf(u) === idx
      );

      let lastErr: unknown = null;
      for (const candidateUrl of candidates) {
        try {
          const buf = await downloadMp3FromUrl(candidateUrl);
          cachedMaxPayneMp3 = buf;
          return buf;
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error('Failed to load Max Payne soundtrack.');
    })().finally(() => {
      pendingMaxPayneFetch = null;
    });

    return pendingMaxPayneFetch;
  };

  app.get('/api/audio/max-payne-theme', async (req, res) => {
    try {
      const mp3Buffer = await fetchMaxPayneThemeBuffer();
      const totalBytes = mp3Buffer.length;
      const slice = parseByteRangeHeader(req.headers.range, totalBytes);

      if (!slice) {
        res.setHeader('Content-Range', `bytes */${totalBytes}`);
        return res.status(416).end();
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Content-Length', String(slice.length));

      if (slice.isPartial) {
        res.status(206);
        res.setHeader('Content-Range', `bytes ${slice.start}-${slice.end}/${totalBytes}`);
      } else {
        res.status(200);
      }

      return res.end(mp3Buffer.subarray(slice.start, slice.end + 1));
    } catch (err) {
      return res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to stream Max Payne soundtrack.',
      });
    }
  });

  // Bind port 3000 immediately so health probes never time out during Vite cold start
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`AIPETROS server running at http://localhost:${PORT}`);
    logSecurityEvent('server.started', { detail: `port ${PORT} · pid ${process.pid}` });
    // Pre-warm the Max Payne theme buffer so clicking Account Settings plays instantaneously
    setTimeout(() => {
      fetchMaxPayneThemeBuffer().catch(() => undefined);
    }, 1200);
    // Non-blocking periodic background meta sync every 30 minutes
    const refreshAllGames = () => {
      for (const gid of COACH_GAME_ORDER) {
        syncLatestGameMeta(gid).catch(() => undefined);
      }
    };
    setTimeout(refreshAllGames, 4000);
    setInterval(refreshAllGames, 30 * 60 * 1000).unref();
  });

  // Real-time chat WebSocket at /ws/chat (token auth at upgrade)
  setupChatWebSocket(server);

  // ---- Aigameria Social Club node (Petros-connection backend) ----
  // Encrypted-at-rest SQLite metadata store (public posts, links, members, lounge)
  const clubStore = new LocalNodeStore(
    path.resolve(process.cwd(), 'data', 'aigameria-node.sqlite'),
  );
  const clubIdentity = clubStore.getOrCreateNodeIdentity();
  const clubSignaling = new P2PSignalingServer({
    nodeId: clubIdentity.nodeId,
    onPublicPost: (post) => clubStore.savePublicPost(post),
  });
  clubSignaling.attach(server, '/ws/signal');
  const clubLanDiscovery = new LanDiscoveryService(
    clubIdentity.nodeId,
    PORT,
    clubIdentity.fingerprint,
  );
  if (process.env.LAN_DISCOVERY_ENABLED !== 'false') {
    clubLanDiscovery.start();
  }
  const clubStreamEngine = new LocalStreamEngine();
  const clubController = new PersonalNodeController({
    store: clubStore,
    identity: clubIdentity,
    signaling: clubSignaling,
    lanDiscovery: clubLanDiscovery,
    streamEngine: clubStreamEngine,
  });
  const clubTelegram = new TelegramBotBridge({ controller: clubController, store: clubStore, streamEngine: clubStreamEngine });
  clubTelegram.startIfConfigured();
  clubController.startHealthMonitor(60_000);
  const clubRamStore = new EphemeralRamStore();
  const clubUploadPipeline = new CloudUploadPipeline([
    new LitterboxProvider(),
    new TmpfilesProvider(),
    new GitHubReleasesProvider(),
    new IpfsPinningProvider(),
    new CatboxProvider(),
    new EphemeralLanMemoryProvider(clubRamStore, () => clubController.getPublicBaseUrl()),
  ]);
  const clubLinkRouters = createLinkAndUploadRouters({
    store: clubStore,
    pipeline: clubUploadPipeline,
    ramStore: clubRamStore,
    controller: clubController,
  });

  app.get('/api/connection/health', (_req, res) => {
    res.json({
      ok: true,
      nodeId: clubIdentity.nodeId,
      fingerprint: clubIdentity.fingerprint,
      uptimeSec: clubController.getStatusSnapshot().uptimeSec,
      zeroStoragePolicy: true,
    });
  });
  app.use('/api/node', createPersonalNodeRouter(clubController, clubStore, clubSignaling));
  app.use('/api/streams', createStreamRouter(clubStreamEngine, clubController));
  app.use('/api/telegram', clubTelegram.createRouter());
  app.use('/api', clubLinkRouters.apiRouter);
  app.use('/', clubLinkRouters.publicRouter);
  startClubSimulation(clubStore);

  // Vite dev middleware vs static production serving
  if (process.env.NODE_ENV !== 'production') {
    // HMR and WebSockets are disabled in AI Studio; serve a clean zero-WebSocket
    // /@vite/client module so Vite 8 never opens a failing wss://...:24678 socket.
    const NO_WS_VITE_CLIENT_JS = `
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if ("document" in globalThis) {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => {
        lastInsertedStyle = undefined;
      }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document
      .querySelectorAll(\`link[rel="stylesheet"][data-vite-dev-id="\${CSS.escape(id)}"]\`)
      .forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  const noop = () => {};
  return {
    data: {},
    accept: noop,
    acceptDeps: noop,
    acceptExports: noop,
    dispose: noop,
    prune: noop,
    decline: noop,
    invalidate: noop,
    on: noop,
    off: noop,
    send: noop,
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}
export class ErrorOverlay {
  close() {}
}
`;

    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(NO_WS_VITE_CLIENT_JS);
    });

    const vitePromise = import('vite').then(({ createServer: createViteServer }) =>
      createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
          watch: null,
        },
        appType: 'spa',
      })
    );
    vitePromise.catch((err) => {
      console.error('Failed to initialize Vite dev middleware:', err);
    });
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    // gzip on the fly for big JS/CSS — the production bundle is ~3MB and phones
    // on WiFi/cellular choke on it uncompressed (page looks dead while loading)
    app.get(/\.(js|css|html|json|svg|mp4)$/i, (req, res, next) => {
      const accept = String(req.headers['accept-encoding'] ?? '');
      if (!accept.includes('gzip')) return next();
      const file = path.join(distDir, decodeURIComponent(req.path.replace(/^\//, '')));
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
      const ext = path.extname(file).toLowerCase();
      if (ext === '.mp4') return next(); // video: let express.static stream range requests
      const types: Record<string, string> = {
        '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html',
        '.json': 'application/json', '.svg': 'image/svg+xml',
      };
      const type = types[ext] ?? 'application/octet-stream';
      const buf = fs.readFileSync(file);
      zlib.gzip(buf, (err, gz) => {
        if (err) return next();
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', type);
        res.setHeader('Cache-Control', ext === '.html' ? 'no-store' : 'public, max-age=31536000');
        res.end(gz);
      });
    });
    app.use(express.static(distDir, {
      setHeaders: (res, filePath) => {
        // iOS Safari heuristically caches HTML that has no Cache-Control —
        // that is how phones end up on an old bundle forever.
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
      },
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }
}

startServer();
