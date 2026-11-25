import type { LocalNodeStore } from './personal-server/localStore';

/**
 * Aigameria Social Club — live community simulation.
 *
 * Seeds the club's SQLite store with member profiles and an ongoing English
 * exchange (public feed posts + public lounge chat) so the club feels like a
 * living product from the very first visit. The public lounge/feed here is the
 * server-backed PUBLIC layer; private DMs/squads in the client stay strictly
 * E2EE P2P per the zero-storage policy.
 */

interface Persona {
  handle: string;
  name: string;
  role: string;
  mainTag: string;
  region: string;
  status: string;
}

export const CLUB_PERSONAS: Persona[] = [
  { handle: 'AIGAMERIA_OP', name: 'AIGAMERIA Operator', role: 'Club Founder', mainTag: '#Games', region: 'NA-West · Low-Latency Mesh', status: 'online' },
  { handle: 'Nova_Strike', name: 'Nova Strike', role: 'Squad Lead', mainTag: '#CS2', region: 'EU-Central', status: 'in-game' },
  { handle: 'Kairo_GG', name: 'Kairo', role: 'Tactician', mainTag: '#CallOfDuty', region: 'NA-East', status: 'in-game' },
  { handle: 'Vega_Pulse', name: 'Vega Pulse', role: 'Club Mod', mainTag: '#Games', region: 'NA-West', status: 'online' },
  { handle: 'Soren_Drift', name: 'Soren Drift', role: 'Striker', mainTag: '#FIFA', region: 'EU-North', status: 'online' },
  { handle: 'Mina_Echo', name: 'Mina Echo', role: 'Support Main', mainTag: '#Valorant', region: 'SEA', status: 'online' },
  { handle: 'Dex_Runner', name: 'Dex Runner', role: 'Fragger', mainTag: '#ApexLegends', region: 'NA-West', status: 'in-game' },
  { handle: 'Lira_Vex', name: 'Lira Vex', role: 'IGL', mainTag: '#RainbowSix', region: 'EU-West', status: 'online' },
];

const LOUNGE_LINES: Array<{ handle: string; content: string }> = [
  { handle: 'Nova_Strike', content: 'Queueing Premier in 5 — need one more for the stack, who is in?' },
  { handle: 'Kairo_GG', content: 'Ranked grind later. Yesterday the 4-2-3-1 half-space drill finally clicked for me.' },
  { handle: 'Vega_Pulse', content: 'Reminder: clean-play rules apply in every squad room. No cheat talk, no exceptions.' },
  { handle: 'Soren_Drift', content: 'Pro Clubs night on Friday? I am taking the striker role, full stamina build.' },
  { handle: 'Mina_Echo', content: 'Just hit Immortal 2 on the new patch. Sentinels setup with the double controller comp works.' },
  { handle: 'Dex_Runner', content: 'That last ring-fight in Worlds Edge was pure chaos — 3 squads rotated at once.' },
  { handle: 'Lira_Vex', content: 'Reviewing the IGL notes from the scrims. Our default setups need faster mid-round calls.' },
  { handle: 'AIGAMERIA_OP', content: 'Club tournament bracket drops this weekend. Sign-ups open to every member.' },
  { handle: 'Nova_Strike', content: 'DMs are E2EE and peer-to-peer here, by the way. Public lounge is for open talk only.' },
  { handle: 'Kairo_GG', content: 'Anyone got a good warm-up routine before ranked? Sharing mine in the club feed.' },
  { handle: 'Mina_Echo', content: 'Patch notes thread is pinned in the feed. Utility nerfs are bigger than people think.' },
  { handle: 'Soren_Drift', content: 'LFG for the weekend tournament — flexible on any role except keeper.' },
];

const FEED_POSTS: Array<{ handle: string; gameTag: string; content: string }> = [
  { handle: 'AIGAMERIA_OP', gameTag: '#Games', content: 'Welcome to the Aigameria Social Club — squad rooms, E2EE direct messages, and a zero-storage public feed. Post your LFG and clip links here.' },
  { handle: 'Nova_Strike', gameTag: '#CS2', content: 'Full Premier VOD review posted. Entry pathing on Inferno banana is the difference between 12 and 16 rounds.' },
  { handle: 'Kairo_GG', gameTag: '#CallOfDuty', content: 'Ranked tips thread: play the hill AFTER the rotation window, not during. 200 points earned sitting anchor.' },
  { handle: 'Mina_Echo', gameTag: '#Valorant', content: 'Sentinel setup guide for Ascent A-site is live. One tripwire, one cage, zero wasted utility.' },
  { handle: 'Soren_Drift', gameTag: '#FIFA', content: 'Pro Clubs build sheet shared — 5\'9" striker, 92 finishing, 85 stamina. Works in every division.' },
  { handle: 'Dex_Runner', gameTag: '#ApexLegends', content: 'Clipped my best arena 1v3. Positioning beats aim until Diamond — then you need both.' },
  { handle: 'Lira_Vex', gameTag: '#RainbowSix', content: 'Scrims summary: our site takes are fine, the win condition is the retake protocol. Writing it up tonight.' },
  { handle: 'Vega_Pulse', gameTag: '#Games', content: 'Club mods note: report links, not opinions. We keep the feed clean and the squad rooms focused.' },
];

function pick<T>(arr: T[], excludeIndex: number): { item: T; index: number } {
  const idx = (excludeIndex + 1 + Math.floor(Math.random() * Math.max(1, arr.length - 1))) % arr.length;
  return { item: arr[idx], index: idx };
}

export function startClubSimulation(store: LocalNodeStore, options?: { intervalMs?: number }): void {
  const intervalMs = options?.intervalMs ?? 90_000;

  // Seed members once
  if (store.listClubMembers(1).length === 0) {
    const now = Date.now();
    CLUB_PERSONAS.forEach((p, i) =>
      store.upsertClubMember({
        id: `member-${p.handle.toLowerCase()}`,
        handle: p.handle,
        name: p.name,
        role: p.role,
        mainTag: p.mainTag,
        region: p.region,
        status: p.status,
        createdAt: now - (CLUB_PERSONAS.length - i) * 86_400_000,
      }),
    );
  }

  // Seed initial public exchange once
  if (store.listPublicPosts(1).length === 0) {
    const now = Date.now();
    FEED_POSTS.slice(0, 4).forEach((p, i) =>
      store.savePublicPost({
        id: `pub-seed-${i}-${p.handle}`,
        handle: p.handle,
        gameTag: p.gameTag,
        content: p.content,
        createdAtMs: now - (4 - i) * 3_600_000,
      }),
    );
  }
  if (store.listClubChatMessages(1).length === 0) {
    const now = Date.now();
    LOUNGE_LINES.slice(0, 6).forEach((l, i) => {
      const persona = CLUB_PERSONAS.find((p) => p.handle === l.handle)!;
      store.saveClubChatMessage({
        id: `chat-seed-${i}-${l.handle}`,
        handle: l.handle,
        name: persona.name,
        content: l.content,
        createdAtMs: now - (6 - i) * 5 * 60_000,
      });
    });
  }

  // Live exchange tick: one lounge line every interval, one feed post every 3rd tick
  let loungeIdx = -1;
  let feedIdx = -1;
  let tick = 0;
  const timer = setInterval(() => {
    try {
      tick += 1;
      const lounge = pick(LOUNGE_LINES, loungeIdx);
      loungeIdx = lounge.index;
      const persona = CLUB_PERSONAS.find((p) => p.handle === lounge.item.handle)!;
      store.saveClubChatMessage({
        id: `chat-live-${Date.now()}-${lounge.item.handle}`,
        handle: lounge.item.handle,
        name: persona.name,
        content: lounge.item.content,
        createdAtMs: Date.now(),
      });
      if (tick % 3 === 0) {
        const post = pick(FEED_POSTS, feedIdx);
        feedIdx = post.index;
        store.savePublicPost({
          id: `pub-live-${Date.now()}-${post.item.handle}`,
          handle: post.item.handle,
          gameTag: post.item.gameTag,
          content: post.item.content,
          createdAtMs: Date.now(),
        });
      }
    } catch {
      // simulation must never crash the node
    }
  }, intervalMs);
  timer.unref();
}
