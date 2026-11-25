import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, Send, Users } from 'lucide-react';
import SocialClubAppCore from './SocialClubAppCore';
import { PageLoadGate } from '../components/spatial/PageLoadGate';

interface SocialClubAppProps {
  /** Skip the invite-only landing gate (the club is unlocked inside AIPETROS). */
  skipInviteGate?: boolean;
  /** Return to the previous AIPETROS view. */
  onExit?: () => void;
}

interface ClubMember {
  id: string;
  handle: string;
  name: string;
  role: string;
  mainTag: string;
  region: string;
  status: string;
}

interface ClubChatMessage {
  id: string;
  handle: string;
  name: string;
  content: string;
  createdAtMs: number;
}

const CONNECTIVITY_BASE = '/api/node';
const CLUB_ACCOUNT_KEY = 'aigameria_club_account_v1';

interface ClubAccount {
  handle: string;
  name: string;
}

function loadAccount(): ClubAccount | null {
  try {
    const raw = window.localStorage.getItem(CLUB_ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClubAccount;
    if (parsed?.handle && parsed?.name) return parsed;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Aigameria Social Club — unified social layer for AIPETROS.
 *
 * The full Petros-connection client (squad rooms, E2EE DMs, feed, clubs,
 * invites, PWA install) is embedded as-is, plus a LIVE LOUNGE panel backed by
 * the server's encrypted-at-rest SQLite store: club members and the public
 * lounge exchange are read/written through the node API, so the community is
 * a real multi-user surface — not a static mock.
 */
export function SocialClubApp({ skipInviteGate = false, onExit }: SocialClubAppProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [messages, setMessages] = useState<ClubChatMessage[]>([]);
  const [isLoungeOpen, setIsLoungeOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [account, setAccount] = useState<ClubAccount | null>(() => loadAccount());
  const [newHandle, setNewHandle] = useState('');
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  // Page-load gate: covered from mount until the first members/chat round-trip lands.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [membersRes, chatRes] = await Promise.all([
        fetch(`${CONNECTIVITY_BASE}/club-members`, { headers: { Accept: 'application/json' } }),
        fetch(`${CONNECTIVITY_BASE}/club-chat`, { headers: { Accept: 'application/json' } }),
      ]);
      if (!membersRes.ok || !chatRes.ok) throw new Error('club api unavailable');
      const membersJson = (await membersRes.json()) as { members?: ClubMember[] };
      const chatJson = (await chatRes.json()) as { messages?: ClubChatMessage[] };
      setMembers(Array.isArray(membersJson.members) ? membersJson.members : []);
      setMessages(Array.isArray(chatJson.messages) ? chatJson.messages : []);
    } catch {
      setApiError('Club node offline — showing local lobby only.');
    } finally {
      setIsRefreshing(false);
      setHasLoadedOnce(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const sendMessage = useCallback(async () => {
    const content = draft.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setApiError(null);
    try {
      const res = await fetch(`${CONNECTIVITY_BASE}/club-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: account?.handle ?? 'AIGAMERIA_OP',
          name: account?.name ?? 'AIGAMERIA Operator',
          content,
        }),
      });
      if (!res.ok) throw new Error('send failed');
      setDraft('');
      await refresh();
    } catch {
      setApiError('Could not send to the club lounge — retry in a moment.');
    } finally {
      setIsSending(false);
    }
  }, [account, draft, isSending, refresh]);

  const createAccount = useCallback(async () => {
    const handle = newHandle.trim().replace(/\s+/g, '_').slice(0, 24);
    const name = newName.trim().slice(0, 40);
    if (!handle || !name || isCreating) return;
    setIsCreating(true);
    setApiError(null);
    try {
      const res = await fetch(`${CONNECTIVITY_BASE}/club-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, name, role: 'Member', mainTag: '#Games', region: 'Global' }),
      });
      if (!res.ok) throw new Error('create failed');
      const created: ClubAccount = { handle, name };
      try {
        window.localStorage.setItem(CLUB_ACCOUNT_KEY, JSON.stringify(created));
      } catch {
        // ignore
      }
      setAccount(created);
      setNewHandle('');
      setNewName('');
      setIsJoinOpen(false);
      await refresh();
    } catch {
      setApiError('Could not create the club account — retry in a moment.');
    } finally {
      setIsCreating(false);
    }
  }, [newHandle, newName, isCreating, refresh]);

  const memberSummary = useMemo(
    () => ({
      online: members.filter((m) => m.status === 'online').length,
      inGame: members.filter((m) => m.status === 'in-game').length,
    }),
    [members],
  );

  return (
    <div className="aigameria-club-root relative w-full h-full overflow-hidden bg-[#0D091A]">
      {/* Page loading gate — covered until the first DB round-trip (members + chat) lands. */}
      <PageLoadGate
        active={!hasLoadedOnce}
        labelFa="در حال لود کامل کلاب..."
        labelEn="Loading social club…"
        testId="club-load-gate"
      />
      {/* Exit to the previous AIPETROS view */}
      {onExit && (
        <button
          type="button"
          data-testid="social-club-back-btn"
          onClick={onExit}
          aria-label="Back to lobby"
          className="absolute top-[4.75rem] right-3 z-[70] flex items-center gap-1.5 rounded-xl bg-[#120C24]/85 border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/85 hover:bg-[#1B1333] hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to lobby
        </button>
      )}

      {/* Live lounge toggle (DB-backed public exchange) */}
      <button
        type="button"
        data-testid="club-lounge-toggle"
        onClick={() => setIsLoungeOpen((v) => !v)}
        aria-label="Toggle live club lounge"
        className={`absolute top-[4.75rem] left-3 z-[70] flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold cursor-pointer ${
          isLoungeOpen
            ? 'bg-[#FF6B35]/25 border-[#FF6B35]/60 text-white'
            : 'bg-[#120C24]/85 border-white/15 text-white/85 hover:text-white'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        Live Lounge · {memberSummary.online + memberSummary.inGame}
      </button>

      {isLoungeOpen && (
        <aside
          data-testid="club-lounge-panel"
          className="absolute top-[7.75rem] left-3 z-[69] w-[min(92vw,360px)] max-h-[70vh] flex flex-col rounded-2xl bg-[#0D091A]/95 border border-white/12 backdrop-blur-md overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div>
              <p className="text-xs font-bold text-white">Club Lounge</p>
              <p className="text-[10px] text-white/50">
                {members.length} members · live exchange
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="club-account-btn"
                onClick={() => setIsJoinOpen((v) => !v)}
                className="rounded-lg bg-white/[0.06] border border-white/10 px-2 py-1 text-[10px] font-semibold text-white/85 hover:bg-white/[0.12] cursor-pointer"
              >
                {account ? `@${account.handle}` : 'Join club'}
              </button>
              <button
                type="button"
                onClick={() => void refresh()}
                aria-label="Refresh lounge"
                className="rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {isJoinOpen && (
            <div data-testid="club-join-form" className="px-3 py-2 border-b border-white/10 space-y-1.5">
              <input
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="Handle (e.g. ProPlayer99)"
                aria-label="New club handle"
                className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/35 outline-none focus:border-[#FF6B35]/60"
              />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Display name"
                aria-label="New club display name"
                className="w-full rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/35 outline-none focus:border-[#FF6B35]/60"
              />
              <button
                type="button"
                data-testid="club-account-create"
                onClick={() => void createAccount()}
                disabled={isCreating || !newHandle.trim() || !newName.trim()}
                className="w-full rounded-lg bg-[#FF6B35]/85 px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40 cursor-pointer"
              >
                {isCreating ? 'Creating account…' : 'Create account & join'}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 studio-scroll">
            {apiError && (
              <p className="text-[10px] text-amber-300/90">{apiError}</p>
            )}
            {messages.length === 0 && !apiError && (
              <p className="text-[10px] text-white/45">No messages yet.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className="rounded-xl bg-white/[0.04] border border-white/8 px-2.5 py-1.5">
                <p className="text-[10px] font-bold text-[#FF9F43]">
                  {m.name} <span className="text-white/40 font-normal">@{m.handle}</span>
                </p>
                <p className="text-[11px] leading-snug text-white/85">{m.content}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-white/10">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void sendMessage();
              }}
              placeholder="Message the club…"
              aria-label="Club lounge message"
              className="flex-1 rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/35 outline-none focus:border-[#FF6B35]/60"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isSending || !draft.trim()}
              aria-label="Send club message"
              className="rounded-lg bg-[#FF6B35]/85 px-2.5 py-1.5 text-white disabled:opacity-40 cursor-pointer"
            >
              {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </aside>
      )}

      {/* The full Petros-connection client */}
      <div className="absolute inset-0">
        <SocialClubAppCore skipInviteGate={skipInviteGate} />
      </div>
    </div>
  );
}

export default SocialClubApp;
