export type HubMenuKind = 'game-ps5' | 'audio-spotify' | 'cinema-netflix';

export interface HubMenuDescriptor {
  id: string;
  titleFa: string;
  subtitleFa: string;
  accentHex: string;
  badgeText?: string;
}

let sharedAudioCtx: AudioContext | null = null;
let ps5SoundMuted = true; // menu interaction sounds disabled entirely (user request 2026-11-23)

export function setHubMenuSoundMuted(muted: boolean): void {
  ps5SoundMuted = muted;
}

export function isHubMenuSoundMuted(): boolean {
  return ps5SoundMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || ps5SoundMuted) return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new Ctor();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume().catch(() => undefined);
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * PlayStation 5 UI Acoustic Synthesizer:
 * - 'tick': signature crisp DualSense/PS5 directional navigation tick-tick
 * - 'open': airy PS5 Control Center harmonic glass swell
 * - 'confirm': crisp DualSense confirm chime
 * - 'close': soft descending PS5 exit swoosh
 */
export function playPs5UiSound(kind: 'open' | 'tick' | 'confirm' | 'close'): void {
  // Permanently disabled: user mandate — menu interactions must stay silent,
  // only coach speech is allowed. Hard no-op regardless of the mute toggle.
  void kind;
  return;
}

/**
 * Subtle tactile Spotify tap & Netflix cinematic low-bloom feedback
 */
export function playSpotifyTapSound(kind: 'open' | 'tap'): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(kind === 'open' ? 420 : 580, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'open' ? 540 : 480, now + 0.045);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.035, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // ignore
  }
}

export function playNetflixMenuSound(kind: 'open' | 'hover' | 'select'): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    if (kind === 'open') {
      // Deep cinema sub-swell + crisp upper shimmer
      const sub = ctx.createOscillator();
      const g = ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(98, now);
      sub.frequency.exponentialRampToValueAtTime(146.83, now + 0.28);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.08, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      sub.connect(g);
      g.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.36);
      return;
    }
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(kind === 'hover' ? 680 : 520, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'hover' ? 760 : 780, now + 0.045);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(kind === 'hover' ? 0.025 : 0.055, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // ignore
  }
}

/**
 * Xbox Console Dashboard / NXE Guide crisp green nexus chimes
 */
export function playXboxUiSound(kind: 'open' | 'tick' | 'select' | 'close'): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    if (kind === 'open') {
      const notes = [392.0, 587.33, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.032);
        g.gain.setValueAtTime(0.0001, now + idx * 0.032);
        g.gain.linearRampToValueAtTime(0.055, now + idx * 0.032 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.032 + 0.28);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + idx * 0.032);
        osc.stop(now + idx * 0.032 + 0.3);
      });
      return;
    }
    if (kind === 'tick') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.022);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.034);
      return;
    }
    if (kind === 'select') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.075);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.065, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
      return;
    }
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.085);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.04, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  } catch {
    // ignore
  }
}

export function stepMenuFocusIndex(currentIndex: number, total: number, delta: number): number {
  if (total <= 0) return 0;
  return ((currentIndex + delta) % total + total) % total;
}

export function getGamePs5MenuItems(options: {
  hasVideoBackdrop: boolean;
  useVideoBackdrop: boolean;
}): HubMenuDescriptor[] {
  const items: HubMenuDescriptor[] = [
    {
      id: 'demo',
      titleFa: 'شروع سریع تحلیل مربی',
      subtitleFa: 'ورود فوری به صحنهٔ تاکتیکی و مربی هوشمند',
      accentHex: '#34D399',
      badgeText: 'بازی زنده',
    },
    {
      id: 'tournament',
      titleFa: 'هاب تورنمنت ۳بعدی',
      subtitleFa: 'رقابت‌ها، جدول حذفی و جوایز لیگ',
      accentHex: '#FBBF24',
      badgeText: 'تورنمنت',
    },
    {
      id: 'social',
      titleFa: 'ورود به سوشال کلاب',
      subtitleFa: 'گپ گیمرها، کلاب‌ها و اشتراک‌گذاری کلیپ',
      accentHex: '#38BDF8',
      badgeText: 'کلاب و چت',
    },
    {
      id: 'identity',
      titleFa: 'پروفایل هویت (Spatial ID)',
      subtitleFa: 'شناسنامهٔ سه‌بعدی و کاراکتر شخصی‌سازی‌شده',
      accentHex: '#818CF8',
      badgeText: 'هویت ۳بعدی',
    },
    {
      id: 'map',
      titleFa: 'نقشه سه‌بعدی محله',
      subtitleFa: 'رادار زنده GTA با لوکیشن واقعی GPS',
      accentHex: '#22D3EE',
      badgeText: 'نقشه',
    },
    {
      id: 'store',
      titleFa: 'فروشگاه AIPETROS',
      subtitleFa: 'تجهیزات، کلکسیون‌ها و کالای گیمینگ',
      accentHex: '#F472B6',
      badgeText: 'استور',
    },
  ];

  // 'backdrop' toggle removed from the quick menu per user request (2026-11-23)

  return items;
}

export function getAudioSpotifyMenuItems(): HubMenuDescriptor[] {
  return [
    {
      id: 'rooms-hub',
      titleFa: 'هاب ۷ فضای سه‌بعدی موزیک',
      subtitleFa: 'کافه وست‌ورلد، کنسرت، ریو برلین، کتابخانه و مدیتیشن',
      accentHex: '#1DB954',
      badgeText: '۷ تالار صدا',
    },
    {
      id: 'player',
      titleFa: 'پلیر + اکولایزر + بوکمارک',
      subtitleFa: 'استودیو پخش زنده، فصل‌بندی کتاب و یادداشت زمانی',
      accentHex: '#1ED760',
      badgeText: 'پخش و اکولایزر',
    },
    {
      id: 'identity',
      titleFa: 'پروفایل سه‌بعدی موزیک',
      subtitleFa: 'ساخت آواتار و پرسونای موسیقی برای سنین ۸ تا ۹۹ سال',
      accentHex: '#38BDF8',
      badgeText: 'پرسونا',
    },
    {
      id: 'social',
      titleFa: 'دیوان صدا · سوشال کلاب کتابی',
      subtitleFa: 'کتاب شعر و فلسفه، حاشیه‌نویسی و نامه‌های صوتی',
      accentHex: '#F59E0B',
      badgeText: 'دیوان و محفل',
    },
    {
      id: 'map',
      titleFa: 'نقشه سه‌بعدی محله',
      subtitleFa: 'رادار زنده GTA با لوکیشن واقعی GPS',
      accentHex: '#22D3EE',
      badgeText: 'نقشه',
    },
    {
      id: 'store',
      titleFa: 'فروشگاه AIPETROS',
      subtitleFa: 'تجهیزات و کالای گیمینگ و موسیقی',
      accentHex: '#F472B6',
      badgeText: 'استور',
    },
  ];
}

export function getCinemaNetflixMenuItems(cinemaDimMode: boolean): HubMenuDescriptor[] {
  return [
    {
      id: 'rooms-hub',
      titleFa: 'هاب ۵ اتاق سه‌بعدی سینما',
      subtitleFa: 'سالن نوآر، جنایی، انیمه توکیو، مستند و استودیو رترو',
      accentHex: '#E50914',
      badgeText: '۵ سالن ویژه',
    },
    {
      id: 'player',
      titleFa: 'پلیر استریم و تحلیل لینک',
      subtitleFa: 'پخش مستقیم فیلم، سریال و اعتبارسنجی امن لینک‌ها',
      accentHex: '#F59E0B',
      badgeText: 'پخش بدون بافر',
    },
    {
      id: 'identity',
      titleFa: 'پروفایل سه‌بعدی سینما (۸ تا ۹۹ سال)',
      subtitleFa: 'ساخت پرسونای سینمایی با شخصیت‌های فیلم و سریال',
      accentHex: '#38BDF8',
      badgeText: 'کارت هویت',
    },
    {
      id: 'social',
      titleFa: 'سوشال کلاب زیرزمینی (CINE-OS)',
      subtitleFa: 'گفت‌وگو با کاربران، ارسال مستقیم لینک فیلم و کلاب',
      accentHex: '#22D3EE',
      badgeText: 'شبکه امن',
    },
    {
      id: 'map',
      titleFa: 'نقشه سه‌بعدی محله',
      subtitleFa: 'رادار زنده GTA با لوکیشن واقعی GPS',
      accentHex: '#22D3EE',
      badgeText: 'نقشه',
    },
    {
      id: 'store',
      titleFa: 'فروشگاه AIPETROS',
      subtitleFa: 'تجهیزات و کالای گیمینگ و سینما',
      accentHex: '#F472B6',
      badgeText: 'استور',
    },
    {
      id: 'dim',
      titleFa: cinemaDimMode ? 'نور عادی سالن سینما' : 'تاریک‌سازی سینمایی (Cinema Mode)',
      subtitleFa: cinemaDimMode
        ? 'بازگردانی نور محیطی سالن پخش'
        : 'کاهش نور اطراف برای تمرکز کامل روی پرده',
      accentHex: '#F87171',
      badgeText: cinemaDimMode ? 'روشن' : 'حالت سالن',
    },
  ];
}
