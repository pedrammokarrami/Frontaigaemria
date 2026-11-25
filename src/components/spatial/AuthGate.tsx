import React, { useCallback, useEffect, useState } from 'react';
import { Chrome, Apple, Gamepad2, Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  clearSession,
  fetchProviders,
  loginAccount,
  registerAccount,
  registerDevice,
  resendActivation,
  saveSession,
  type StoredSession,
} from '../../services/authClient';

interface AuthGateProps {
  onAuthed: (session: StoredSession) => void;
  onGuest: () => void;
}

type Mode = 'login' | 'register';

/**
 * Aigameria v1.02 — register/login gate. Theme is identical to the Aigameria
 * social club (dark #0D091A + orange→pink→cyan gradients). Standards:
 * email+password with activation email, OAuth sign-in (Google / Apple /
 * Epic / Steam / Microsoft), post-login device registration.
 */
export const AuthGate: React.FC<AuthGateProps> = ({ onAuthed, onGuest }) => {
  const { languageCode } = useLanguage();
  const isFa = languageCode.toLowerCase().startsWith('fa');
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [providers, setProviders] = useState<Array<{ id: string; label: string; configured: boolean }>>([]);

  useEffect(() => { void fetchProviders().then(setProviders); }, []);

  const finish = useCallback((session: StoredSession) => {
    saveSession(session);
    void registerDevice();
    onAuthed(session);
  }, [onAuthed]);

  // OAuth callback landing: /auth?token=... — standard post-redirect exchange
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const expiresAt = params.get('expiresAt');
    if (token && expiresAt) {
      finish({ token, expiresAt, provider: 'oauth' });
      window.history.replaceState(null, '', window.location.pathname);
    } else if (params.get('error')) {
      setError(`${params.get('error')}`);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [finish]);

  const t = {
    title: isFa ? 'ورود به Aigameria' : 'Enter Aigameria',
    subtitle: isFa ? 'حساب Aigameria بساز یا وارد شو — نسخه ۱.۰۲' : 'Create or enter your Aigameria account — v1.02',
    login: isFa ? 'ورود' : 'Sign in',
    register: isFa ? 'ساخت حساب' : 'Create account',
    email: isFa ? 'ایمیل' : 'Email',
    password: isFa ? 'رمز عبور' : 'Password',
    displayName: isFa ? 'اسم نمایشی' : 'Display name',
    continue: isFa ? 'ادامه' : 'Continue',
    guest: isFa ? 'ورود به‌عنوان مهمان' : 'Continue as guest',
    providers: isFa ? 'یا ورود با:' : 'Or sign in with:',
    activation: isFa ? 'لینک فعال‌سازی به ایمیلت رفت — ایمیل رو چک کن و برگرد.' : 'Activation link sent — check your email, then sign in.',
    resend: isFa ? 'ارسال دوباره لینک' : 'Resend link',
    devLinkLabel: isFa ? 'حالت توسعه — لینک فعال‌سازی:' : 'Dev mode — activation link:',
  };

  const providerIcon = (id: string) => {
    if (id === 'google') return <Chrome className="w-4 h-4" />;
    if (id === 'apple') return <Apple className="w-4 h-4" />;
    if (id === 'epic') return <Gamepad2 className="w-4 h-4" />;
    return <ShieldCheck className="w-4 h-4" />;
  };

  const handleProvider = (id: string) => {
    if (!providers.find((p) => p.id === id)?.configured) {
      setError(isFa
        ? `${id} هنوز تنظیم نشده — کلاینت OAuth باید تو پنل سرور تنظیم بشه.`
        : `${id} OAuth is not configured on this deployment yet.`);
      return;
    }
    window.location.href = `/api/v1/auth/oauth/${id}/start`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setDevLink(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        const r = await registerAccount(email.trim(), password, displayName.trim() || email.split('@')[0]);
        if (!r.ok) {
          setError(r.error);
        } else {
          setNotice(t.activation);
          setDevLink(r.devActivationUrl ?? null);
        }
      } else {
        const r = await loginAccount(email.trim(), password);
        if (!r.ok) {
          setError(r.error);
        } else if (r.token) {
          finish({
            token: r.token,
            expiresAt: r.expiresAt,
            email: r.user?.email ?? email,
            displayName: r.user?.displayName ?? undefined,
            provider: 'email',
          });
        }
      }
    } catch {
      setError(isFa ? 'ارتباط برقرار نشد — دوباره تلاش کن.' : 'Network error — try again.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    const r = await resendActivation(email.trim());
    setDevLink(r.devActivationUrl ?? null);
    setBusy(false);
  };

  return (
    <div
      data-testid="aigameria-auth-gate"
      className="fixed inset-0 z-[200] w-full h-dvh overflow-y-auto bg-[#0D091A] text-[#F7F4FF]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 15% -10%, rgba(255,107,53,0.14), transparent 60%), radial-gradient(ellipse 65% 45% at 88% 0%, rgba(255,62,138,0.11), transparent 58%), radial-gradient(ellipse 55% 45% at 50% 105%, rgba(34,211,238,0.08), transparent 60%)',
      }}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 text-center">
          <p className="font-bold tracking-[0.2em] text-2xl bg-gradient-to-r from-[#FFF5F0] via-[#FF9F43] to-[#FF3E8A] bg-clip-text text-transparent">
            AIGAMERIA
          </p>
          <h1 className="mt-2 text-lg font-semibold text-white/90">{t.title}</h1>
          <p className="mt-1 text-xs text-[#9B8FB8]">{t.subtitle}</p>
        </div>

        {/* Mode switch */}
        <div className="mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1 text-xs font-semibold">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setNotice(null); }}
              className={`rounded-xl px-3 py-2 transition-colors cursor-pointer ${mode === m ? 'bg-gradient-to-r from-[#FF6B35]/25 to-[#FF3E8A]/25 text-white' : 'text-[#9B8FB8] hover:text-white'}`}
            >
              {m === 'login' ? t.login : t.register}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-3xl border border-white/10 bg-[#120C24]/70 p-5 backdrop-blur-md">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-[#9B8FB8]">{t.displayName}</span>
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                <User className="h-4 w-4 text-[#FF9F43]" />
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-white/25"
                  placeholder={isFa ? 'مثلاً: ProPlayer99' : 'e.g. ProPlayer99'}
                  autoComplete="nickname"
                />
              </span>
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-[#9B8FB8]">{t.email}</span>
            <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <Mail className="h-4 w-4 text-[#FF9F43]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/25"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-[#9B8FB8]">{t.password}</span>
            <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <Lock className="h-4 w-4 text-[#FF9F43]" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/25"
                placeholder={isFa ? 'حداقل ۱۰ کاراکتر' : 'min 10 characters'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="toggle password" className="text-[#9B8FB8] hover:text-white cursor-pointer">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          {error && <p data-testid="auth-error" className="rounded-xl bg-[#F43F5E]/15 px-3 py-2 text-[11px] font-semibold text-[#FDA4AF]">{error}</p>}
          {notice && (
            <div className="rounded-xl bg-[#34D399]/12 px-3 py-2 text-[11px] font-semibold text-[#6EE7B7]">
              {notice}
              {mode === 'register' && email && (
                <button type="button" onClick={resend} className="ml-2 underline hover:text-white cursor-pointer">{t.resend}</button>
              )}
            </div>
          )}
          {devLink && (
            <p className="break-all rounded-xl bg-white/[0.04] px-3 py-2 text-[10px] text-[#9B8FB8]">
              {t.devLinkLabel} <a data-testid="auth-dev-activation-link" href={devLink} className="underline text-[#6EE7B7]">{devLink}</a>
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] via-[#FF3E8A] to-[#22D3EE] px-4 py-3 text-sm font-bold text-[#0D091A] shadow-lg shadow-[#FF3E8A]/20 disabled:opacity-50 cursor-pointer"
          >
            {busy ? '…' : mode === 'login' ? t.login : t.register}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* OAuth providers */}
        <div className="mt-5">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9B8FB8]">{t.providers}</p>
          <div className="grid grid-cols-2 gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                data-testid={`auth-provider-${p.id}`}
                onClick={() => handleProvider(p.id)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-semibold transition-colors ${
                  p.configured
                    ? 'border-white/12 bg-white/[0.05] text-white/90 hover:bg-white/[0.1] cursor-pointer'
                    : 'border-white/5 bg-white/[0.02] text-white/35'
                }`}
              >
                {providerIcon(p.id)}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          data-testid="auth-guest-btn"
          onClick={onGuest}
          className="mx-auto mt-6 text-[11px] font-semibold text-[#9B8FB8] underline-offset-4 hover:text-white hover:underline cursor-pointer"
        >
          {t.guest}
        </button>
      </div>
    </div>
  );
};

/** Higher-order gate: blocks the app until authed / guest choice. */
export function useAuthGate(): { ready: boolean; authed: boolean; gate: React.ReactNode; onAuthed: (s: StoredSession) => void; onGuest: () => void } {
  const [state, setState] = useState<'checking' | 'gate' | 'in'>(() =>
    typeof window === 'undefined' ? 'checking' : (window.localStorage.getItem('aigameria_session_v2') || window.localStorage.getItem('aigameria_guest_v2') ? 'in' : 'gate'),
  );
  const [authed, setAuthed] = useState(false);

  const onAuthed = useCallback((s: StoredSession) => {
    setAuthed(true);
    setState('in');
    void s;
  }, []);
  const onGuest = useCallback(() => {
    setAuthed(false);
    setState('in');
    window.localStorage.setItem('aigameria_guest_v2', '1');
  }, []);

  return {
    ready: state === 'in',
    authed,
    gate: state === 'checking' ? null : <AuthGate key="auth-gate" onAuthed={onAuthed} onGuest={onGuest} />,
    onAuthed,
    onGuest,
  };
}
