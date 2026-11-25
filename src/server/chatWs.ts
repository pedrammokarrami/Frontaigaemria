import crypto from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { getDb, logSecurityEvent, nowIso, uuid } from './db';
import { sanitizeText } from './security';

/**
 * Real-time chat over WebSocket (ws) at /ws/chat:
 *  - token auth at upgrade time (no unauthenticated sockets)
 *  - room membership checks, typing indicator, presence, delivered/seen acks
 *  - every message persisted to SQLite before broadcast (no message loss)
 *  - anti-spam rate limiting + content sanitization + audit logging
 *  - heartbeat to drop dead connections; client reconnects automatically
 */

const HEARTBEAT_MS = 30_000;
const MSG_RATE_WINDOW_MS = 10_000;
const MSG_RATE_MAX = 10;

interface ClientState {
  ws: WebSocket;
  userId: string;
  displayName: string;
  rooms: Set<string>;
  isAlive: boolean;
  msgTimes: number[];
}

const clients = new Set<ClientState>();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function authenticateUpgrade(req: IncomingMessage): { userId: string; displayName: string } | null {
  const url = new URL(req.url ?? '/ws/chat', 'http://localhost');
  if (url.pathname !== '/ws/chat') return null;
  const token = url.searchParams.get('token');
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.display_name FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .get(hashToken(token), nowIso()) as { id: string; display_name: string } | undefined;
  if (!row) return null;
  return { userId: row.id, displayName: row.display_name };
}

function isMember(userId: string, roomId: string): boolean {
  return Boolean(
    getDb().prepare('SELECT 1 AS ok FROM chat_members WHERE room_id = ? AND user_id = ?').get(roomId, userId)
  );
}

function roomExists(roomId: string): boolean {
  return Boolean(getDb().prepare('SELECT 1 AS ok FROM chat_rooms WHERE id = ?').get(roomId));
}

function sendTo(client: ClientState, payload: unknown): void {
  if (client.ws.readyState === client.ws.OPEN) {
    client.ws.send(JSON.stringify(payload));
  }
}

function broadcast(roomId: string, payload: unknown, exceptUserId?: string): void {
  for (const client of clients) {
    if (exceptUserId && client.userId === exceptUserId) continue;
    if (client.rooms.has(roomId)) sendTo(client, payload);
  }
}

/**
 * Broadcast a chat message to all sockets in a room — used by the REST send
 * endpoint so HTTP-sent messages reach WebSocket listeners too.
 */
export function broadcastChatMessage(message: {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  body: string;
  createdAt: string;
}): void {
  broadcast(message.roomId, { type: 'message', data: message });
}

export function setupChatWebSocket(server: import('node:http').Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    // Only claim the /ws/chat path — other upgrade handlers (e.g. the Aigameria
    // club P2P signaling at /ws/signal) must own their own sockets.
    const url = new URL(req.url ?? '/ws/chat', 'http://localhost');
    if (url.pathname !== '/ws/chat') return;
    const auth = authenticateUpgrade(req);
    if (!auth) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      logSecurityEvent('chat.ws_auth_failed', { ip: req.socket.remoteAddress ?? null });
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, auth);
    });
  });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, auth: { userId: string; displayName: string }) => {
    const client: ClientState = {
      ws,
      userId: auth.userId,
      displayName: auth.displayName,
      rooms: new Set(),
      isAlive: true,
      msgTimes: [],
    };
    clients.add(client);

    // auto-join the user's rooms
    const memberships = getDb()
      .prepare('SELECT room_id FROM chat_members WHERE user_id = ?')
      .all(client.userId) as Array<{ room_id: string }>;
    for (const m of memberships) client.rooms.add(m.room_id);

    sendTo(client, {
      type: 'connected',
      data: { userId: client.userId, rooms: [...client.rooms] },
    });
    broadcastPresence();

    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('message', (raw) => {
      let msg: { type?: string; roomId?: string; body?: string };
      try {
        msg = JSON.parse(String(raw)) as { type?: string; roomId?: string; body?: string };
      } catch {
        sendTo(client, { type: 'error', error: { code: 'BAD_JSON', message: 'Message must be JSON.' } });
        return;
      }

      switch (msg.type) {
        case 'join': {
          const roomId = String(msg.roomId ?? '');
          if (!roomExists(roomId)) {
            sendTo(client, { type: 'error', error: { code: 'ROOM_NOT_FOUND', message: 'Room not found.' } });
            return;
          }
          if (!isMember(client.userId, roomId)) {
            sendTo(client, { type: 'error', error: { code: 'NOT_MEMBER', message: 'Join the room via REST first.' } });
            logSecurityEvent('chat.ws_join_denied', { userId: client.userId, detail: roomId });
            return;
          }
          client.rooms.add(roomId);
          sendTo(client, { type: 'joined', data: { roomId } });
          return;
        }
        case 'leave': {
          client.rooms.delete(String(msg.roomId ?? ''));
          sendTo(client, { type: 'left', data: { roomId: msg.roomId } });
          return;
        }
        case 'typing': {
          const roomId = String(msg.roomId ?? '');
          if (!client.rooms.has(roomId)) return;
          broadcast(roomId, { type: 'typing', data: { roomId, userId: client.userId, displayName: client.displayName } }, client.userId);
          return;
        }
        case 'seen': {
          const roomId = String(msg.roomId ?? '');
          if (!client.rooms.has(roomId)) return;
          getDb().prepare('UPDATE chat_messages SET seen_at = ? WHERE room_id = ? AND user_id != ? AND seen_at IS NULL').run(
            nowIso(),
            roomId,
            client.userId
          );
          broadcast(roomId, { type: 'seen', data: { roomId, userId: client.userId } });
          return;
        }
        case 'message': {
          const roomId = String(msg.roomId ?? '');
          const body = sanitizeText(String(msg.body ?? ''), 1000);
          if (!body) {
            sendTo(client, { type: 'error', error: { code: 'EMPTY_MESSAGE', message: 'Message body is required.' } });
            return;
          }
          if (!client.rooms.has(roomId) || !isMember(client.userId, roomId)) {
            sendTo(client, { type: 'error', error: { code: 'NOT_MEMBER', message: 'You are not a member of this room.' } });
            return;
          }
          // anti-spam rate limit per connection
          const now = Date.now();
          client.msgTimes = client.msgTimes.filter((t) => now - t < MSG_RATE_WINDOW_MS);
          if (client.msgTimes.length >= MSG_RATE_MAX) {
            sendTo(client, { type: 'error', error: { code: 'RATE_LIMITED', message: `Max ${MSG_RATE_MAX} messages per 10s.` } });
            return;
          }
          client.msgTimes.push(now);

          const id = uuid('msg');
          const createdAt = nowIso();
          getDb()
            .prepare('INSERT INTO chat_messages (id, room_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(id, roomId, client.userId, body, createdAt);
          const messagePayload = {
            type: 'message',
            data: { id, roomId, userId: client.userId, displayName: client.displayName, body, createdAt },
          };
          broadcast(roomId, messagePayload);
          return;
        }
        default:
          sendTo(client, { type: 'error', error: { code: 'UNKNOWN_TYPE', message: 'Unknown message type.' } });
      }
    });

    ws.on('close', () => {
      clients.delete(client);
      broadcastPresence();
      logSecurityEvent('chat.ws_disconnect', { userId: client.userId });
    });
  });

  // heartbeat: terminate dead sockets so clients reconnect
  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (!client.isAlive) {
        client.ws.terminate();
        clients.delete(client);
        continue;
      }
      client.isAlive = false;
      if (client.ws.readyState === client.ws.OPEN) client.ws.ping();
    }
  }, HEARTBEAT_MS);
  heartbeat.unref();

  return wss;
}

function broadcastPresence(): void {
  const online = [...new Set([...clients].map((c) => c.userId))];
  for (const client of clients) {
    sendTo(client, { type: 'presence', data: { online } });
  }
}

export function chatPresenceCount(): number {
  return clients.size;
}
