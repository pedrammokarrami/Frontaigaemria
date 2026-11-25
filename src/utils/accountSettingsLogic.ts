export interface AccountSession {
  id: string;
  deviceName: string;
  platform: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AccountProfileSettings {
  displayName: string;
  handle: string;
  email: string;
  emailVerified: boolean;
  recoveryEmail: string;
  phone: string;
  twoFactorEnabled: boolean;
  loginAlertsEnabled: boolean;
  showOnlineStatus: boolean;
  tournamentNotifications: boolean;
  autoSyncProfile: boolean;
  passwordUpdatedAt: string;
  sessions: AccountSession[];
  signedOut: boolean;
}

export interface PasswordStrengthReport {
  score: 0 | 1 | 2 | 3 | 4;
  labelFa: string;
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export interface NoirThemeNote {
  freq: number;
  durationSec: number;
  chordFreqs?: number[];
  pianoArpFreqs?: number[];
}

export const ACCOUNT_SETTINGS_STORAGE_KEY = 'aipetros_account_settings_v1';

export const DEFAULT_ACCOUNT_SETTINGS: AccountProfileSettings = {
  displayName: 'Kian Rostami',
  handle: '@kian.spatial',
  email: 'elikhademi68@gmail.com',
  emailVerified: true,
  recoveryEmail: 'backup.kian@aipetros.gg',
  phone: '+98 912 ••• 4821',
  twoFactorEnabled: true,
  loginAlertsEnabled: true,
  showOnlineStatus: true,
  tournamentNotifications: true,
  autoSyncProfile: true,
  passwordUpdatedAt: '۱۴۰۴/۰۸/۱۲',
  signedOut: false,
  sessions: [
    {
      id: 'sess-current',
      deviceName: 'Desktop Workstation · Chrome',
      platform: 'Web Spatial Client',
      location: 'Tehran, IR',
      lastActive: 'فعال اکنون',
      isCurrent: true,
    },
    {
      id: 'sess-ios',
      deviceName: 'iPhone 16 Pro · Companion App',
      platform: 'iOS 18',
      location: 'Tehran, IR',
      lastActive: '۲ ساعت پیش',
      isCurrent: false,
    },
    {
      id: 'sess-console',
      deviceName: 'PlayStation 5 · AIPETROS Link',
      platform: 'Console Bridge',
      location: 'Frankfurt Relay',
      lastActive: 'دیروز · ۲۱:۱۴',
      isCurrent: false,
    },
  ],
};

/**
 * Iconic Max Payne snowy rooftop neo-noir C-minor cello & sparse echoing piano theme.
 * Captures the slow, grieving cello intervals over a lone snow-lit minor piano ostinato.
 */
export const MAX_PAYNE_NOIR_CELLO_THEME: NoirThemeNote[] = [
  // Opening haunting solo cello phrase (Cm -> G/B -> Cm/Bb -> Abmaj7)
  {
    freq: 130.81, // C3
    durationSec: 2.4,
    chordFreqs: [65.41, 130.81, 155.56, 196.0],
    pianoArpFreqs: [261.63, 311.13, 392.0, 523.25],
  },
  {
    freq: 196.0, // G3 — signature yearning leap
    durationSec: 2.2,
    pianoArpFreqs: [392.0, 311.13, 261.63],
  },
  {
    freq: 207.65, // Ab3 — aching minor 6th tension
    durationSec: 1.9,
    chordFreqs: [103.83, 155.56, 207.65, 261.63],
    pianoArpFreqs: [415.3, 392.0, 311.13],
  },
  {
    freq: 196.0, // G3
    durationSec: 2.1,
    pianoArpFreqs: [392.0, 311.13, 293.66],
  },
  {
    freq: 155.56, // Eb3
    durationSec: 1.8,
    chordFreqs: [87.31, 130.81, 174.61, 207.65],
    pianoArpFreqs: [349.23, 311.13, 261.63],
  },
  {
    freq: 174.61, // F3
    durationSec: 1.7,
    pianoArpFreqs: [349.23, 415.3, 392.0],
  },
  {
    freq: 146.83, // D3 — suspended sorrow over G7
    durationSec: 2.6,
    chordFreqs: [98.0, 146.83, 174.61, 246.94],
    pianoArpFreqs: [293.66, 392.0, 493.88, 392.0],
  },
  // Answering phrase — deep descending winter sigh into snow
  {
    freq: 233.08, // Bb3
    durationSec: 1.8,
    chordFreqs: [103.83, 155.56, 196.0, 233.08],
    pianoArpFreqs: [466.16, 392.0, 311.13],
  },
  {
    freq: 207.65, // Ab3
    durationSec: 1.8,
    pianoArpFreqs: [415.3, 349.23, 261.63],
  },
  {
    freq: 196.0, // G3
    durationSec: 2.0,
    chordFreqs: [65.41, 130.81, 155.56, 196.0],
    pianoArpFreqs: [392.0, 311.13, 261.63],
  },
  {
    freq: 174.61, // F3
    durationSec: 1.6,
    pianoArpFreqs: [349.23, 311.13, 261.63],
  },
  {
    freq: 155.56, // Eb3
    durationSec: 1.9,
    chordFreqs: [87.31, 130.81, 155.56, 207.65],
    pianoArpFreqs: [311.13, 261.63, 207.65],
  },
  {
    freq: 146.83, // D3
    durationSec: 1.8,
    chordFreqs: [98.0, 123.47, 174.61, 246.94],
    pianoArpFreqs: [293.66, 246.94, 196.0],
  },
  {
    freq: 123.47, // B2 — dark leading tone
    durationSec: 1.9,
    pianoArpFreqs: [246.94, 293.66, 392.0],
  },
  {
    freq: 130.81, // C3 — long lingering resolution in the falling snow
    durationSec: 3.6,
    chordFreqs: [65.41, 130.81, 155.56, 196.0, 261.63],
    pianoArpFreqs: [261.63, 311.13, 392.0, 523.25],
  },
];

export function validateEmailAddress(rawEmail: string): { valid: boolean; error?: string } {
  const email = rawEmail.trim();
  if (!email) {
    return { valid: false, error: 'لطفاً آدرس ایمیل را وارد کنید.' };
  }
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!pattern.test(email)) {
    return { valid: false, error: 'فرمت آدرس ایمیل معتبر نیست (مثال: name@domain.com).' };
  }
  return { valid: true };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthReport {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return { score: 0, labelFa: 'خالی', checks };
  }

  let raw = 0;
  if (checks.minLength) raw += 1;
  if (checks.hasUpper && checks.hasLower) raw += 1;
  if (checks.hasNumber) raw += 1;
  if (checks.hasSymbol) raw += 1;
  if (password.length >= 12 && raw < 4) raw += 1;

  const score = Math.min(4, Math.max(1, raw)) as 1 | 2 | 3 | 4;
  const labels: Record<1 | 2 | 3 | 4, string> = {
    1: 'ضعیف',
    2: 'متوسط',
    3: 'خوب',
    4: 'بسیار قوی',
  };

  return { score, labelFa: labels[score], checks };
}

export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): { valid: boolean; error?: string } {
  if (!currentPassword.trim()) {
    return { valid: false, error: 'لطفاً رمز عبور فعلی خود را وارد کنید.' };
  }
  const strength = evaluatePasswordStrength(newPassword);
  if (!strength.checks.minLength) {
    return { valid: false, error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.' };
  }
  if (!strength.checks.hasNumber || !(strength.checks.hasUpper || strength.checks.hasLower)) {
    return {
      valid: false,
      error: 'رمز عبور جدید باید شامل حروف انگلیسی و حداقل یک عدد باشد.',
    };
  }
  if (newPassword === currentPassword) {
    return { valid: false, error: 'رمز عبور جدید نباید با رمز عبور فعلی یکسان باشد.' };
  }
  if (newPassword !== confirmPassword) {
    return { valid: false, error: 'تکرار رمز عبور با رمز عبور جدید مطابقت ندارد.' };
  }
  return { valid: true };
}

export function revokeAccountSession(
  sessions: AccountSession[],
  sessionId: string
): AccountSession[] {
  return sessions.filter((session) => session.isCurrent || session.id !== sessionId);
}

export function revokeAllOtherSessions(sessions: AccountSession[]): AccountSession[] {
  return sessions.filter((session) => session.isCurrent);
}

export function loadAccountSettings(): AccountProfileSettings {
  if (typeof window === 'undefined') {
    return structuredClone(DEFAULT_ACCOUNT_SETTINGS);
  }
  try {
    const raw = window.localStorage.getItem(ACCOUNT_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AccountProfileSettings>;
      if (parsed && typeof parsed.email === 'string') {
        return {
          ...structuredClone(DEFAULT_ACCOUNT_SETTINGS),
          ...parsed,
          sessions:
            Array.isArray(parsed.sessions) && parsed.sessions.length > 0
              ? parsed.sessions
              : structuredClone(DEFAULT_ACCOUNT_SETTINGS.sessions),
        };
      }
    }
  } catch {
    // Fallback cleanly to deterministic defaults
  }
  return structuredClone(DEFAULT_ACCOUNT_SETTINGS);
}

export function persistAccountSettings(settings: AccountProfileSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACCOUNT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota restrictions
  }
}
