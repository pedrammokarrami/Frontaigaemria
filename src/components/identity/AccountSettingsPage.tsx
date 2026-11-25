import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  Monitor,
  Music,
  Pause,
  Play,
  Shield,
  Smartphone,
  Trash2,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import maxPayneRooftopBackdrop from '../../assets/images/max_payne_snow_rooftop_1795181513344.jpg';
import {
  type AccountProfileSettings,
  evaluatePasswordStrength,
  loadAccountSettings,
  persistAccountSettings,
  revokeAccountSession,
  revokeAllOtherSessions,
  validateEmailAddress,
  validatePasswordChange,
} from '../../utils/accountSettingsLogic';
import type { MaxPayneNoirAudioEngine } from '../../utils/maxPayneNoirAudio';
import { MaxPayneSnowCanvas } from './MaxPayneSnowCanvas';

export type AccountSettingsSection = 'account' | 'security' | 'privacy' | 'sessions';

interface AccountSettingsPageProps {
  onBack: () => void;
  audioEngine: MaxPayneNoirAudioEngine;
  onDisplayNameChange?: (name: string) => void;
}

const NAV_SECTIONS: { id: AccountSettingsSection; label: string }[] = [
  { id: 'account', label: 'حساب و ایمیل' },
  { id: 'security', label: 'رمز عبور و امنیت' },
  { id: 'privacy', label: 'حریم خصوصی و اعلان‌ها' },
  { id: 'sessions', label: 'نشست‌ها و خروج' },
];

export const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({
  onBack,
  audioEngine,
  onDisplayNameChange,
}) => {
  const [settings, setSettings] = useState<AccountProfileSettings>(() => loadAccountSettings());
  const [activeSection, setActiveSection] = useState<AccountSettingsSection>('account');

  // Music & atmospheric rooftop view state
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(() => audioEngine.getIsPlaying());
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => audioEngine.getIsMuted());
  const [audioSource, setAudioSource] = useState<'track' | 'synth'>(() => audioEngine.getSourceMode());
  const [sceneFocusMode, setSceneFocusMode] = useState<boolean>(false);

  // Account & Email form state
  const [displayNameInput, setDisplayNameInput] = useState(settings.displayName);
  const [handleInput, setHandleInput] = useState(settings.handle);
  const [phoneInput, setPhoneInput] = useState(settings.phone);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  const [newEmailInput, setNewEmailInput] = useState(settings.email);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Password & Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [recoveryEmailInput, setRecoveryEmailInput] = useState(settings.recoveryEmail);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  // Sign out confirmation state
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [reSignInEmail, setReSignInEmail] = useState(settings.email);
  const [reSignInPassword, setReSignInPassword] = useState('');
  const [reSignInError, setReSignInError] = useState<string | null>(null);

  const passwordStrength = useMemo(() => evaluatePasswordStrength(newPassword), [newPassword]);

  // Persist account settings locally
  useEffect(() => {
    persistAccountSettings(settings);
  }, [settings]);

  // Ensure soundtrack runs cleanly on entry and stops cleanly on exit
  useEffect(() => {
    const syncState = () => {
      setIsMusicPlaying(audioEngine.getIsPlaying());
      setIsMusicMuted(audioEngine.getIsMuted());
      setAudioSource(audioEngine.getSourceMode());
    };
    const unsubscribe = audioEngine.subscribe(syncState);
    if (!audioEngine.getIsPlaying()) {
      audioEngine.start();
    }
    syncState();
    return () => {
      unsubscribe();
      audioEngine.stop();
    };
  }, [audioEngine]);

  const handleTogglePlayMusic = () => {
    if (isMusicPlaying) {
      audioEngine.stop();
      setIsMusicPlaying(false);
    } else {
      const ok = audioEngine.start();
      setIsMusicPlaying(ok);
      if (isMusicMuted) {
        audioEngine.setMuted(false);
        setIsMusicMuted(false);
      }
    }
  };

  const handleToggleMuteMusic = () => {
    const next = !isMusicMuted;
    setIsMusicMuted(next);
    audioEngine.setMuted(next);
  };

  const handleSaveProfileDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = displayNameInput.trim() || settings.displayName;
    const cleanedHandle = handleInput.trim() || settings.handle;
    const cleanedPhone = phoneInput.trim() || settings.phone;

    setSettings((prev) => ({
      ...prev,
      displayName: cleanedName,
      handle: cleanedHandle.startsWith('@') ? cleanedHandle : `@${cleanedHandle}`,
      phone: cleanedPhone,
    }));
    onDisplayNameChange?.(cleanedName);
    setProfileFeedback('مشخصات حساب کاربری با موفقیت ذخیره شد.');
  };

  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const result = validateEmailAddress(newEmailInput);
    if (!result.valid) {
      setEmailError(result.error ?? 'آدرس ایمیل معتبر نیست.');
      return;
    }

    const normalized = newEmailInput.trim().toLowerCase();
    setSettings((prev) => ({
      ...prev,
      email: normalized,
      emailVerified: true,
    }));
    setReSignInEmail(normalized);
    setEmailSuccess(`ایمیل اصلی حساب به ${normalized} تغییر یافت و ثبت شد.`);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const validation = validatePasswordChange(currentPassword, newPassword, confirmPassword);
    if (!validation.valid) {
      setPasswordError(validation.error ?? 'لطفاً فیلدهای رمز عبور را بررسی کنید.');
      return;
    }

    setSettings((prev) => ({
      ...prev,
      passwordUpdatedAt: 'هم‌اکنون',
    }));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess('رمز عبور جدید با موفقیت ثبت شد و تمام کلیدهای امنیتی به‌روزرسانی شدند.');
  };

  const handleSaveRecoveryEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryNotice(null);
    const check = validateEmailAddress(recoveryEmailInput);
    if (!check.valid) {
      setRecoveryNotice(check.error ?? 'ایمیل بازیابی معتبر نیست.');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      recoveryEmail: recoveryEmailInput.trim().toLowerCase(),
    }));
    setRecoveryNotice('ایمیل بازیابی حساب ذخیره شد.');
  };

  const handleRevokeSession = (sessionId: string) => {
    setSettings((prev) => ({
      ...prev,
      sessions: revokeAccountSession(prev.sessions, sessionId),
    }));
  };

  const handleRevokeAllOthers = () => {
    setSettings((prev) => ({
      ...prev,
      sessions: revokeAllOtherSessions(prev.sessions),
    }));
  };

  const handleConfirmSignOut = () => {
    setSettings((prev) => ({
      ...prev,
      signedOut: true,
    }));
    setConfirmSignOut(false);
  };

  const handleReSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setReSignInError(null);
    const emailCheck = validateEmailAddress(reSignInEmail);
    if (!emailCheck.valid) {
      setReSignInError(emailCheck.error ?? 'ایمیل نامعتبر است.');
      return;
    }
    if (reSignInPassword.trim().length < 4) {
      setReSignInError('لطفاً رمز عبور خود را وارد کنید.');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      email: reSignInEmail.trim().toLowerCase(),
      signedOut: false,
    }));
    setReSignInPassword('');
  };

  const otherSessionCount = settings.sessions.filter((s) => !s.isCurrent).length;

  return (
    <div
      dir="rtl"
      data-testid="account-settings-noir-page"
      data-music-playing={isMusicPlaying ? 'true' : 'false'}
      data-music-muted={isMusicMuted ? 'true' : 'false'}
      data-audio-source={audioSource}
      data-signed-out={settings.signedOut ? 'true' : 'false'}
      className="relative w-full h-dvh overflow-y-auto overflow-x-hidden bg-[#05080E] text-slate-100 select-text"
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Outfit', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Exact Max Payne Snowy New York Rooftop Backdrop (Unreal Engine 5.8 Lumen) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#05060B]">
        <img
          src={maxPayneRooftopBackdrop}
          alt="سکانس پشت‌بام برفی مکس پین با تابلوی نئون هتل و ماشین پلیس در شب نیویورک"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-100"
        />
        {/* Subtle winter noir vignette that keeps Max Payne (left), red HOTEL neon & blue police cruiser (right) clearly visible */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: sceneFocusMode ? 0.22 : 1,
            background:
              'radial-gradient(ellipse 68% 64% at 50% 45%, rgba(8, 10, 18, 0.34) 0%, rgba(5, 7, 13, 0.28) 60%, rgba(3, 5, 10, 0.62) 100%), linear-gradient(180deg, rgba(5, 7, 13, 0.56) 0%, rgba(7, 9, 16, 0.14) 38%, rgba(4, 6, 11, 0.54) 100%)',
          }}
        />
      </div>

      {/* Live Procedural Multi-Depth Falling Snow + Subtle Neon/Police Glint Overlay */}
      <MaxPayneSnowCanvas />

      {/* 3-Zone Sticky Noir Top Bar */}
      <header className="sticky top-0 z-30 border-b border-white/12 bg-[#06080F]/72">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Back + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              data-testid="account-settings-back-btn"
              onClick={onBack}
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-lg border border-white/15 bg-black/45 hover:bg-white/12 text-slate-100 text-[13px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به پروفایل</span>
            </button>
            <h1 className="hidden md:block text-[15px] font-bold tracking-wide text-slate-100 whitespace-nowrap">
              تنظیمات حساب کاربری
            </h1>
          </div>

          {/* Zone 2: Max Payne Theme Soundtrack Player & Clean Scene Preview Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="toggle-scene-focus-btn"
              onClick={() => setSceneFocusMode((v) => !v)}
              aria-pressed={sceneFocusMode}
              aria-label={sceneFocusMode ? 'نمایش پنل تنظیمات' : 'نمایش کامل سکانس برفی'}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[12px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                sceneFocusMode
                  ? 'border-red-400/55 bg-red-950/65 text-red-100'
                  : 'border-white/15 bg-black/45 hover:bg-white/12 text-slate-200'
              }`}
            >
              {sceneFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {sceneFocusMode ? 'نمایش تنظیمات' : 'نمای کامل سکانس'}
              </span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-[#0A0B12]/85">
              <Music className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="hidden sm:inline text-[11.5px] font-medium text-slate-200 whitespace-nowrap">
                Max Theme Short · مکس پین
              </span>

              {isMusicPlaying && !isMusicMuted && (
                <div className="hidden sm:flex items-end gap-0.5 h-3.5 px-1" aria-hidden="true">
                  <span
                    className="w-0.5 h-full bg-red-400 rounded-full voice-wave-bar"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-0.5 h-full bg-amber-300 rounded-full voice-wave-bar"
                    style={{ animationDelay: '180ms' }}
                  />
                  <span
                    className="w-0.5 h-full bg-red-500 rounded-full voice-wave-bar"
                    style={{ animationDelay: '340ms' }}
                  />
                </div>
              )}

              <button
                type="button"
                data-testid="noir-music-toggle-btn"
                onClick={handleTogglePlayMusic}
                aria-label={isMusicPlaying ? 'توقف موسیقی متن مکس پین' : 'پخش موسیقی متن مکس پین'}
                className="w-7 h-7 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-200 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                {isMusicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                data-testid="noir-music-mute-btn"
                onClick={handleToggleMuteMusic}
                aria-label={isMusicMuted ? 'وصل صدا' : 'بی‌صدا کردن موسیقی'}
                className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/12 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                {isMusicMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container (Hidden cleanly when Scene Focus Mode is active) */}
      <main
        className={`relative z-20 max-w-5xl mx-auto px-4 sm:px-6 py-7 sm:py-10 transition-opacity duration-300 ${
          sceneFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {settings.signedOut ? (
          /* Standard Signed-Out Noir Screen with Re-Login Option */
          <section
            data-testid="signed-out-panel"
            className="max-w-md mx-auto mt-10 rounded-xl border border-white/12 bg-[#080C14]/88 p-6 sm:p-8 shadow-2xl"
          >
            <div className="space-y-2 mb-6">
              <p className="text-[12px] text-amber-400 font-semibold">خروج انجام شد</p>
              <h2 className="text-[22px] font-bold text-white">از حساب کاربری خارج شدید</h2>
              <p className="text-[13.5px] leading-relaxed text-slate-300">
                نشست فعلی شما با امنیت کامل بسته شد. برای دسترسی دوباره به پروفایل سه‌بعدی و تنظیمات، وارد حساب خود شوید.
              </p>
            </div>

            <form onSubmit={handleReSignIn} className="space-y-4">
              <div>
                <label htmlFor="resignin-email" className="block text-[12.5px] font-medium text-slate-300 mb-1.5">
                  آدرس ایمیل
                </label>
                <input
                  id="resignin-email"
                  type="email"
                  dir="ltr"
                  value={reSignInEmail}
                  onChange={(e) => setReSignInEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-white/15 bg-[#0C121D] text-[14px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70"
                />
              </div>

              <div>
                <label htmlFor="resignin-password" className="block text-[12.5px] font-medium text-slate-300 mb-1.5">
                  رمز عبور
                </label>
                <input
                  id="resignin-password"
                  type="password"
                  dir="ltr"
                  value={reSignInPassword}
                  onChange={(e) => setReSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-lg border border-white/15 bg-[#0C121D] text-[14px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70"
                />
              </div>

              {reSignInError && (
                <p className="text-[12.5px] text-rose-300 bg-rose-950/50 border border-rose-500/35 rounded-lg px-3 py-2">
                  {reSignInError}
                </p>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="submit"
                  data-testid="resignin-submit-btn"
                  className="w-full h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[13.5px] font-bold transition cursor-pointer"
                >
                  ورود مجدد به حساب کاربری
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full h-10 rounded-lg border border-white/12 bg-white/5 hover:bg-white/10 text-slate-300 text-[13px] font-medium transition cursor-pointer"
                >
                  بازگشت به صفحه پروفایل
                </button>
              </div>
            </form>
          </section>
        ) : (
          <div className="space-y-7">
            {/* Cinematic Noir Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-[12px] text-amber-400/90 font-medium tracking-wide">
                  {settings.displayName} · <span dir="ltr" className="font-mono-tabular">{settings.handle}</span> ·{' '}
                  <span dir="ltr" className="font-mono-tabular">{settings.email}</span>
                </p>
                <h2 className="text-[26px] sm:text-[32px] font-bold text-white tracking-tight">
                  مدیریت حساب، ایمیل و امنیت
                </h2>
                <p className="text-[14px] text-slate-300 leading-relaxed">
                  تنظیمات استاندارد ورود، تغییر ایمیل و رمز عبور، کنترل دستگاه‌های متصل و خروج امن از حساب کاربری.
                </p>
              </div>

              {/* Direct Quick Sign Out Action */}
              <button
                type="button"
                data-testid="header-quick-signout-btn"
                onClick={() => {
                  setActiveSection('sessions');
                  setConfirmSignOut(true);
                }}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-rose-500/35 bg-rose-950/55 hover:bg-rose-900/70 text-rose-200 text-[13px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب</span>
              </button>
            </div>

            {/* Responsive 2-Column Standard Account Settings Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sidebar Navigation (Horizontal tabs on mobile, sticky rail on desktop) */}
              <nav
                aria-label="بخش‌های تنظیمات حساب کاربری"
                className="lg:col-span-3 rounded-xl border border-white/14 bg-[#070910]/68 p-2 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar"
              >
                {NAV_SECTIONS.map((item) => {
                  const active = activeSection === item.id;
                  const Icon =
                    item.id === 'account'
                      ? UserRound
                      : item.id === 'security'
                        ? KeyRound
                        : item.id === 'privacy'
                          ? Bell
                          : Shield;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`account-nav-${item.id}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-red-600/25 text-red-100 border border-red-400/45'
                          : 'text-slate-200 hover:text-white hover:bg-white/8 border border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Active Settings Panel — Translucent Smoked Obsidian Surface letting the Snowy Rooftop breathe */}
              <section className="lg:col-span-9 rounded-xl border border-white/15 bg-[#070910]/74 p-6 sm:p-8 shadow-2xl">
                {/* SECTION 1: ACCOUNT & EMAIL */}
                {activeSection === 'account' && (
                  <div data-testid="section-account" className="space-y-8">
                    {/* Profile Details */}
                    <div>
                      <h3 className="text-[18px] font-bold text-white mb-1">مشخصات اصلی حساب</h3>
                      <p className="text-[13px] text-slate-400 mb-5">
                        نام نمایشی، شناسه کاربری و شماره تماس ثبت‌شده در کل پلتفرم.
                      </p>

                      <form onSubmit={handleSaveProfileDetails} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="acc-display-name" className="block text-[12.5px] font-medium text-slate-300 mb-1.5">
                              نام نمایشی
                            </label>
                            <input
                              id="acc-display-name"
                              data-testid="input-display-name"
                              type="text"
                              value={displayNameInput}
                              onChange={(e) => setDisplayNameInput(e.target.value)}
                              className="w-full h-11 px-3.5 rounded-lg border border-white/15 bg-[#0D131F] text-[14px] text-white focus:outline-none focus:border-amber-400/70"
                            />
                          </div>

                          <div>
                            <label htmlFor="acc-handle" className="block text-[12.5px] font-medium text-slate-300 mb-1.5">
                              نام کاربری (Handle)
                            </label>
                            <input
                              id="acc-handle"
                              type="text"
                              dir="ltr"
                              value={handleInput}
                              onChange={(e) => setHandleInput(e.target.value)}
                              className="w-full h-11 px-3.5 rounded-lg border border-white/15 bg-[#0D131F] text-[14px] font-mono-tabular text-white focus:outline-none focus:border-amber-400/70"
                            />
                          </div>
                        </div>

                        <div className="max-w-sm">
                          <label htmlFor="acc-phone" className="block text-[12.5px] font-medium text-slate-300 mb-1.5">
                            شماره موبایل تاییدشده
                          </label>
                          <input
                            id="acc-phone"
                            type="text"
                            dir="ltr"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-lg border border-white/15 bg-[#0D131F] text-[14px] font-mono-tabular text-white focus:outline-none focus:border-amber-400/70"
                          />
                        </div>

                        {profileFeedback && (
                          <p className="text-[12.5px] text-emerald-300 flex items-center gap-1.5">
                            <Check className="w-4 h-4 shrink-0" />
                            <span>{profileFeedback}</span>
                          </p>
                        )}

                        <div className="pt-1">
                          <button
                            type="submit"
                            data-testid="save-profile-info-btn"
                            className="h-10 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[13px] font-bold transition cursor-pointer"
                          >
                            ذخیره مشخصات
                          </button>
                        </div>
                      </form>
                    </div>

                    <hr className="border-white/10" />

                    {/* Email Address Management */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h3 className="text-[18px] font-bold text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-amber-400" />
                          <span>آدرس ایمیل حساب کاربری</span>
                        </h3>
                        <span className="text-[12px] text-emerald-400 font-medium">
                          {settings.emailVerified ? 'تایید شده' : 'در انتظار تایید'}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-400 mb-5">
                        ایمیل فعلی: <span dir="ltr" className="font-mono-tabular text-slate-200">{settings.email}</span> — برای ورود، بازیابی رمز عبور و هشدارهای امنیتی استفاده می‌شود.
                      </p>

                      <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-lg">
                        <div>
                          <label htmlFor="acc-email-input" className="block text-[12.5px] font-medium text-slate-300 mb-1.5">
                            ایمیل جدید
                          </label>
                          <input
                            id="acc-email-input"
                            data-testid="input-account-email"
                            type="email"
                            dir="ltr"
                            value={newEmailInput}
                            onChange={(e) => setNewEmailInput(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full h-11 px-3.5 rounded-lg border border-white/15 bg-[#0D131F] text-[14px] font-mono-tabular text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70"
                          />
                        </div>

                        {emailError && (
                          <p data-testid="email-error-msg" className="text-[12.5px] text-rose-300">
                            {emailError}
                          </p>
                        )}
                        {emailSuccess && (
                          <p data-testid="email-success-msg" className="text-[12.5px] text-emerald-300 flex items-center gap-1.5">
                            <Check className="w-4 h-4 shrink-0" />
                            <span>{emailSuccess}</span>
                          </p>
                        )}

                        <button
                          type="submit"
                          data-testid="update-email-btn"
                          className="h-10 px-5 rounded-lg border border-amber-400/45 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-[13px] font-semibold transition cursor-pointer"
                        >
                          به‌روزرسانی ایمیل
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* SECTION 2: PASSWORD & SECURITY */}
                {activeSection === 'security' && (
                  <div data-testid="section-security" className="space-y-8">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h3 className="text-[18px] font-bold text-white">تغییر رمز عبور</h3>
                        <span className="text-[12px] text-slate-400">
                          آخرین تغییر: <span className="text-slate-200">{settings.passwordUpdatedAt}</span>
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-400 mb-5">
                        برای امنیت بیشتر از رمز عبوری با حداقل ۸ کاراکتر شامل حروف بزرگ، کوچک، عدد و علامت استفاده کنید.
                      </p>

                      <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                        {/* Current Password */}
                        <div>
                          <label htmlFor="pw-current" className="block text-[12.5px] font-medium text-slate-300 mb-1.5">
                            رمز عبور فعلی
                          </label>
                          <div className="relative">
                            <input
                              id="pw-current"
                              data-testid="input-current-password"
                              type={showCurrentPw ? 'text' : 'password'}
                              dir="ltr"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-white/15 bg-[#0D131F] text-[14px] text-white focus:outline-none focus:border-amber-400/70"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPw((v) => !v)}
                              aria-label={showCurrentPw ? 'مخفی کردن رمز فعلی' : 'نمایش رمز فعلی'}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            >
                              {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label htmlFor="pw-new" className="block text-[12.5px] font-medium text-slate-300 mb-1.5">
                            رمز عبور جدید
                          </label>
                          <div className="relative">
                            <input
                              id="pw-new"
                              data-testid="input-new-password"
                              type={showNewPw ? 'text' : 'password'}
                              dir="ltr"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="حداقل ۸ کاراکتر"
                              className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-white/15 bg-[#0D131F] text-[14px] text-white focus:outline-none focus:border-amber-400/70"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPw((v) => !v)}
                              aria-label={showNewPw ? 'مخفی کردن رمز جدید' : 'نمایش رمز جدید'}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            >
                              {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Live Password Strength Meter */}
                          <div className="mt-2.5 space-y-2">
                            <div className="flex items-center justify-between text-[11.5px]">
                              <span className="text-slate-400">قدرت رمز عبور</span>
                              <span
                                data-testid="password-strength-label"
                                className={
                                  passwordStrength.score >= 4
                                    ? 'text-emerald-400 font-semibold'
                                    : passwordStrength.score === 3
                                      ? 'text-amber-300 font-semibold'
                                      : passwordStrength.score >= 1
                                        ? 'text-rose-400 font-semibold'
                                        : 'text-slate-500'
                                }
                              >
                                {passwordStrength.labelFa}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[1, 2, 3, 4].map((lvl) => (
                                <div
                                  key={lvl}
                                  className={`h-1.5 rounded-full ${
                                    passwordStrength.score >= lvl
                                      ? passwordStrength.score >= 4
                                        ? 'bg-emerald-500'
                                        : passwordStrength.score === 3
                                          ? 'bg-amber-400'
                                          : 'bg-rose-500'
                                      : 'bg-white/12'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-slate-400">
                              <span className={passwordStrength.checks.minLength ? 'text-emerald-400' : ''}>
                                حداقل ۸ کاراکتر
                              </span>
                              <span className={passwordStrength.checks.hasUpper ? 'text-emerald-400' : ''}>
                                حروف بزرگ
                              </span>
                              <span className={passwordStrength.checks.hasNumber ? 'text-emerald-400' : ''}>
                                عدد
                              </span>
                              <span className={passwordStrength.checks.hasSymbol ? 'text-emerald-400' : ''}>
                                کاراکتر خاص (#!@)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label htmlFor="pw-confirm" className="block text-[12.5px] font-medium text-slate-300 mb-1.5">
                            تکرار رمز عبور جدید
                          </label>
                          <div className="relative">
                            <input
                              id="pw-confirm"
                              data-testid="input-confirm-password"
                              type={showConfirmPw ? 'text' : 'password'}
                              dir="ltr"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="تکرار دقیق رمز جدید"
                              className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-white/15 bg-[#0D131F] text-[14px] text-white focus:outline-none focus:border-amber-400/70"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPw((v) => !v)}
                              aria-label={showConfirmPw ? 'مخفی کردن تکرار رمز' : 'نمایش تکرار رمز'}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            >
                              {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {passwordError && (
                          <p data-testid="password-error-msg" className="text-[12.5px] text-rose-300">
                            {passwordError}
                          </p>
                        )}
                        {passwordSuccess && (
                          <p data-testid="password-success-msg" className="text-[12.5px] text-emerald-300 flex items-center gap-1.5">
                            <Check className="w-4 h-4 shrink-0" />
                            <span>{passwordSuccess}</span>
                          </p>
                        )}

                        <button
                          type="submit"
                          data-testid="update-password-btn"
                          className="h-10 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[13px] font-bold transition cursor-pointer"
                        >
                          ثبت رمز عبور جدید
                        </button>
                      </form>
                    </div>

                    <hr className="border-white/10" />

                    {/* Two-Factor Authentication & Recovery Email */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-[15px] font-bold text-white">احراز هویت دومرحله‌ای (2FA)</h4>
                          <p className="text-[13px] text-slate-400 mt-0.5">
                            هنگام ورود از دستگاه جدید، کد تایید یک‌بارمصرف درخواست می‌شود.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={settings.twoFactorEnabled}
                          data-testid="toggle-2fa-btn"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              twoFactorEnabled: !prev.twoFactorEnabled,
                            }))
                          }
                          className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${
                            settings.twoFactorEnabled ? 'bg-amber-500' : 'bg-white/15'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                              settings.twoFactorEnabled ? 'right-1' : 'right-6'
                            }`}
                          />
                        </button>
                      </div>

                      <form onSubmit={handleSaveRecoveryEmail} className="space-y-3 max-w-lg">
                        <label htmlFor="acc-recovery-email" className="block text-[12.5px] font-medium text-slate-300">
                          ایمیل بازیابی اضطراری
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <input
                            id="acc-recovery-email"
                            type="email"
                            dir="ltr"
                            value={recoveryEmailInput}
                            onChange={(e) => setRecoveryEmailInput(e.target.value)}
                            className="flex-1 h-10 px-3.5 rounded-lg border border-white/15 bg-[#0D131F] text-[13.5px] font-mono-tabular text-white focus:outline-none focus:border-amber-400/70"
                          />
                          <button
                            type="submit"
                            className="h-10 px-4 rounded-lg border border-white/15 bg-white/8 hover:bg-white/14 text-white text-[13px] font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            ذخیره ایمیل بازیابی
                          </button>
                        </div>
                        {recoveryNotice && (
                          <p className="text-[12.5px] text-amber-300">{recoveryNotice}</p>
                        )}
                      </form>
                    </div>
                  </div>
                )}

                {/* SECTION 3: PRIVACY & NOTIFICATIONS */}
                {activeSection === 'privacy' && (
                  <div data-testid="section-privacy" className="space-y-6">
                    <div>
                      <h3 className="text-[18px] font-bold text-white mb-1">حریم خصوصی و اعلان‌ها</h3>
                      <p className="text-[13px] text-slate-400">
                        تنظیم نحوه اطلاع‌رسانی رویدادهای امنیتی، نمایش وضعیت آنلاین و همگام‌سازی پروفایل.
                      </p>
                    </div>

                    <div className="divide-y divide-white/10">
                      {[
                        {
                          key: 'loginAlertsEnabled' as const,
                          title: 'هشدار امنیتی ورودهای جدید',
                          desc: 'ارسال ایمیل فوری هنگام ورود به حساب از مرورگر یا دستگاه ناشناس.',
                        },
                        {
                          key: 'showOnlineStatus' as const,
                          title: 'نمایش وضعیت آنلاین در لابی و کلاب',
                          desc: 'دوستان و اعضای کلاب می‌توانند آنلاین بودن شما را در بازی‌ها ببینند.',
                        },
                        {
                          key: 'tournamentNotifications' as const,
                          title: 'اعلان تورنمنت‌ها و دعوت‌نامه‌های مسابقه',
                          desc: 'اطلاع‌رسانی شروع رقابت‌ها و پیام‌های مربی هوشمند.',
                        },
                        {
                          key: 'autoSyncProfile' as const,
                          title: 'همگام‌سازی خودکار پروفایل در ۱۱ بازی',
                          desc: 'ذخیره خودکار تغییرات هویت و لینک‌های سوشال در تمام فضاهای بازی.',
                        },
                      ].map((pref) => {
                        const checked = settings[pref.key];
                        return (
                          <div key={pref.key} className="py-4 flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-[14.5px] font-semibold text-white">{pref.title}</h4>
                              <p className="text-[12.5px] text-slate-400 mt-0.5">{pref.desc}</p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={checked}
                              data-testid={`toggle-${pref.key}`}
                              onClick={() =>
                                setSettings((prev) => ({
                                  ...prev,
                                  [pref.key]: !prev[pref.key],
                                }))
                              }
                              className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${
                                checked ? 'bg-amber-500' : 'bg-white/15'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                                  checked ? 'right-1' : 'right-6'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECTION 4: ACTIVE SESSIONS & SIGN OUT */}
                {activeSection === 'sessions' && (
                  <div data-testid="section-sessions" className="space-y-8">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-[18px] font-bold text-white">نشست‌ها و دستگاه‌های فعال</h3>
                          <p className="text-[13px] text-slate-400 mt-0.5">
                            دستگاه‌هایی که هم‌اکنون به حساب شما متصل هستند.
                          </p>
                        </div>

                        {otherSessionCount > 0 && (
                          <button
                            type="button"
                            data-testid="revoke-all-sessions-btn"
                            onClick={handleRevokeAllOthers}
                            className="h-9 px-3.5 rounded-lg border border-white/15 bg-white/6 hover:bg-white/12 text-slate-200 text-[12px] font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            خروج از همه دستگاه‌های دیگر ({otherSessionCount})
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-white/10 border-y border-white/10">
                        {settings.sessions.map((session) => (
                          <div
                            key={session.id}
                            data-testid={`session-row-${session.id}`}
                            className="py-3.5 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                                {session.platform.includes('iOS') ? (
                                  <Smartphone className="w-4 h-4" />
                                ) : (
                                  <Monitor className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-semibold text-white truncate" dir="ltr">
                                  {session.deviceName}
                                </p>
                                <p className="text-[12px] text-slate-400">
                                  {session.location} · {session.lastActive}
                                </p>
                              </div>
                            </div>

                            {session.isCurrent ? (
                              <span className="text-[12px] text-emerald-400 font-semibold whitespace-nowrap shrink-0">
                                دستگاه فعلی
                              </span>
                            ) : (
                              <button
                                type="button"
                                data-testid={`revoke-session-${session.id}`}
                                onClick={() => handleRevokeSession(session.id)}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/12 hover:border-rose-400/50 bg-white/5 hover:bg-rose-950/40 text-slate-300 hover:text-rose-200 text-[12px] font-medium transition cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>لغو نشست</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Standard Sign Out Area */}
                    <div className="pt-2 space-y-4">
                      <div>
                        <h3 className="text-[18px] font-bold text-rose-200">خروج از حساب کاربری</h3>
                        <p className="text-[13px] text-slate-400 mt-1">
                          با خروج از حساب، نشست فعلی روی این مرورگر بسته می‌شود و برای ادامه باید مجدداً وارد شوید.
                        </p>
                      </div>

                      {!confirmSignOut ? (
                        <button
                          type="button"
                          data-testid="initiate-signout-btn"
                          onClick={() => setConfirmSignOut(true)}
                          className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-[13.5px] font-bold transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>خروج از حساب کاربری</span>
                        </button>
                      ) : (
                        <div
                          data-testid="confirm-signout-bar"
                          className="p-4 rounded-lg border border-rose-500/40 bg-rose-950/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <p className="text-[13px] text-rose-100 font-medium">
                            آیا مطمئن هستید که می‌خواهید از حساب <span dir="ltr" className="font-mono-tabular">{settings.email}</span> خارج شوید؟
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              data-testid="confirm-signout-btn"
                              onClick={handleConfirmSignOut}
                              className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[12.5px] font-bold transition cursor-pointer whitespace-nowrap"
                            >
                              تایید خروج
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmSignOut(false)}
                              className="h-9 px-3.5 rounded-lg border border-white/15 bg-white/8 hover:bg-white/14 text-slate-200 text-[12.5px] font-medium transition cursor-pointer whitespace-nowrap"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
