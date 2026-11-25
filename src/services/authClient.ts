/**
 * Aigameria v1.02 — auth client (register / login / OAuth / devices).
 * Session persists in localStorage; after login the device record (FCM token,
 * location, permissions) is registered per the auth standards.
 */
export const SESSION_KEY = 'aigameria_session_v2';
export const GUEST_KEY = 'aigameria_guest_v2';

export interface StoredSession {
  token: string;
  expiresAt: string;
  email?: string;
  displayName?: string;
  provider?: string;
}

export function loadSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    if (s.expiresAt && new Date(s.expiresAt).getTime() < Date.now()) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveSession(s: StoredSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  window.localStorage.removeItem(GUEST_KEY);
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export function isGuest(): boolean {
  return window.localStorage.getItem(GUEST_KEY) === '1';
}

export function setGuest(): void {
  window.localStorage.setItem(GUEST_KEY, '1');
}

export function authHeader(): Record<string, string> {
  const s = loadSession();
  return s?.token ? { Authorization: `Bearer ${s.token}` } : {};
}

interface Envelope<T> { success?: boolean; data?: T; token?: string; error?: { code?: string; message?: string } }

async function call<T>(method: string, path: string, body?: unknown): Promise<{ status: number; json: Envelope<T> }> {
  const resp = await fetch(`/api/v1${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: Envelope<T> = {};
  try { json = (await resp.json()) as Envelope<T>; } catch { /* ignore */ }
  return { status: resp.status, json };
}

export async function registerAccount(email: string, password: string, displayName: string) {
  const { status, json } = await call<{ user: unknown; token: string; expiresAt: string; devActivationUrl?: string; activationEmailSent?: boolean }>(
    'POST', '/auth/register', { email, password, displayName },
  );
  if (status === 201 && json.data) return { ok: true as const, ...json.data };
  return { ok: false as const, error: json.error?.message ?? `HTTP ${status}` };
}

export async function loginAccount(email: string, password: string) {
  const { status, json } = await call<{ user: { email?: string; displayName?: string }; token: string; expiresAt: string; emailVerified?: boolean }>(
    'POST', '/auth/login', { email, password },
  );
  if (status === 200 && json.data) return { ok: true as const, ...json.data };
  return { ok: false as const, error: json.error?.message ?? `HTTP ${status}` };
}

export async function fetchMe(): Promise<boolean> {
  const { status } = await call('GET', '/auth/me');
  return status === 200;
}

export async function fetchProviders(): Promise<Array<{ id: string; label: string; configured: boolean }>> {
  const { status, json } = await call<{ providers: Array<{ id: string; label: string; configured: boolean }> }>('GET', '/auth/oauth/providers');
  if (status === 200 && json.data?.providers) return json.data.providers;
  return [];
}

export async function resendActivation(email: string) {
  const { json } = await call<{ devActivationUrl?: string }>('POST', '/auth/resend-activation', { email });
  return json.data ?? {};
}

/** Registers the device after login: FCM token, location, permission snapshot. */
export async function registerDevice(): Promise<void> {
  if (isGuest() || !loadSession()) return;
  const permissions: Record<string, boolean> = {};
  try {
    if ('permissions' in navigator) {
      for (const name of ['geolocation', 'notifications', 'camera', 'microphone']) {
        try {
          const st = await navigator.permissions.query({ name: name as PermissionName });
          permissions[name] = st.state === 'granted';
        } catch { /* unsupported on this browser */ }
      }
    }
  } catch { /* ignore */ }
  let location: string | null = null;
  try {
    const geo = await navigator.permissions.query({ name: 'geolocation' });
    if (geo.state === 'granted') {
      location = await new Promise<string | null>((resolve) => {
        const timer = window.setTimeout(() => resolve(null), 5000);
        navigator.geolocation.getCurrentPosition(
          (p) => { window.clearTimeout(timer); resolve(`${p.coords.latitude.toFixed(4)},${p.coords.longitude.toFixed(4)}`); },
          () => { window.clearTimeout(timer); resolve(null); },
          { timeout: 4500 },
        );
      });
    }
  } catch { /* ignore */ }
  const fcmToken = (window as { __aigameriaFcmToken?: string }).__aigameriaFcmToken ?? null;
  try {
    await call('POST', '/devices', {
      fcmToken,
      platform: navigator.platform ?? null,
      location,
      permissions,
    });
  } catch { /* device registration is best-effort */ }
}
