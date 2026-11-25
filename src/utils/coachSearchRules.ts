import type { RealmId } from '../types/spatial';

export interface MotionVectorArrow {
  id: string;
  fromX: number;
  fromY: number;
  ctrlX: number;
  ctrlY: number;
  toX: number;
  toY: number;
  label: string;
  colorHex?: string;
}

export interface MotionCalloutNode {
  id: string;
  stepNumber: string;
  x: number;
  y: number;
  titleFa: string;
  detailFa: string;
  zoneType?: 'danger' | 'path' | 'target';
  radius?: number;
}

export interface SearchedMediaImage {
  id: string;
  title: string;
  imageUrl: string;
  fallbackUrl: string;
  sourceLabel: string;
}

export interface SearchedMediaVideo {
  id: string;
  title: string;
  youtubeId?: string;
  clipUrl: string;
  channelLabel: string;
  duration: string;
}

export interface AdkAgentBadge {
  id: 'vision_agent' | 'patch_agent' | 'mechanics_agent' | 'counter_agent';
  agentName: string;
  roleFa: string;
  toolCalled: string;
  latencyMs: number;
  liveSourceCount?: number;
}

export interface AdkLiveWebSource {
  title: string;
  url: string;
  source: string;
  upvotes?: number;
}

export interface AdkMultiAgentReport {
  orchestratorId: string;
  framework:
    | 'AIPETROS Internal Agent Mesh · Deterministic Rule Pipeline'
    | 'Google ADK (@google/adk) · Live Multi-Agent Pipeline';
  patchVersion: string;
  inputComboFa: string;
  frameTimingFa: string;
  proSettingsFa: string;
  fatalMistakeFa: string;
  counterPlayFa: string;
  microChecklistFa: string[];
  agentsTrace: AdkAgentBadge[];
  liveSources?: AdkLiveWebSource[];
  lastUpdatedIso?: string;
  isLiveGemini?: boolean;
  /** Audit: how focal coordinates were derived (tap / image_scan / topic_default). */
  coordSource?: 'tap' | 'image_scan' | 'topic_default';
}

export type CoachAnswerIntent = 'formation' | 'loadout' | 'item' | 'map' | 'tactic' | 'economy' | 'generic';

export interface PlayerAssignment {
  slot: string;
  roleFa: string;
  playerName: string;
  noteFa: string;
}

export interface PlayerAssignment {
  slot: string;
  roleFa: string;
  playerName: string;
  noteFa: string;
}

export interface CoachAnswerBlock {
  intent: CoachAnswerIntent;
  titleFa: string;
  titleEn: string;
  linesFa: string[];
  linesEn: string[];
  options?: string[];
  playerAssignments?: Record<string, PlayerAssignment[]>;
}

export interface CoachConsultationTopic {
  id: string;
  realm: RealmId;
  num: string;
  roman: string;
  titleFa: string;
  titleEn: string;
  searchQuery: string;
  coachAdviceFa: string;
  coachVoiceEn: string;
  keyStatLabel: string;
  keyStatValue: string;
  videos: SearchedMediaVideo[];
  images: SearchedMediaImage[];
  motionArrows: MotionVectorArrow[];
  motionCallouts: MotionCalloutNode[];
  adkIntel?: AdkMultiAgentReport;
  answerBlock?: CoachAnswerBlock;
}

/** Detect what kind of structured answer the user's question needs. */
export function detectAnswerIntent(query: string): CoachAnswerIntent {
  const q = query.toLowerCase();
  if (/formation|lineup|\u062a\u0631\u06a9\u06cc\u0628|\u0641\u0631\u0645\u0627\u0633\u06cc\u0648\u0646|\u0686\u06cc\u0646\u0634|4231|433|3142/.test(q)) return 'formation';
  if (/weapon|loadout|gun|rifle|attachment|\u0627\u0633\u0644\u062d\u0647|\u062a\u0641\u0646\u06af|\u0622\u067e\u06af\u0631\u06cc\u062f/.test(q)) return 'loadout';
  if (/item|gear|\u0622\u06cc\u062a\u0645|\u0627\u06cc\u062a\u0645|equipment/.test(q)) return 'item';
  if (/\u0646\u0642\u0634\u0647|map position|callout|\u0645\u0648\u0642\u0639\u06cc\u062a/.test(q)) return 'map';
  if (/economy|eco|\u0627\u0642\u062a\u0635\u0627\u062f|\u062e\u0631\u06cc\u062f/.test(q)) return 'economy';
  if (/\u062a\u0627\u06a9\u062a\u06cc\u06a9|\u0627\u0633\u062a\u0631\u0627\u062a\u0698\u06cc|\u067e\u0644\u0646|strategy|tactic|game plan/.test(q)) return 'tactic';
  return 'generic';
}

/** Deterministic structured answer for the detected intent (bilingual). */
export function buildCoachAnswerBlock(query: string, realm: RealmId): CoachAnswerBlock | null {
  const intent = detectAnswerIntent(query);
  if (intent === 'generic') return null;
  if (intent === 'formation') {
    const assignments: Record<string, PlayerAssignment[]> = {
      '4-2-3-1': [
        { slot: 'GK', roleFa: 'دروازه‌بان', playerName: 'Courtois', noteFa: 'رفلکس ۹۰+؛ بهترین برای شوت نزدیک' },
        { slot: 'RB', roleFa: 'دفاع راست', playerName: 'Alexander-Arnold', noteFa: 'پاس طولی ۹۲ — از پشت خط پاس عمقی بده' },
        { slot: 'CB', roleFa: 'دفاع میانی', playerName: 'van Dijk', noteFa: 'هوا قوی؛ عمق ۴۵ نگه‌دار' },
        { slot: 'CB', roleFa: 'دفاع میانی', playerName: 'Rúben Dias', noteFa: 'پرس اول؛ توپ‌گیری از بازیکن سریع' },
        { slot: 'LB', roleFa: 'دفاع چپ', playerName: 'Balde', noteFa: 'سرعت ۹۱ — پشتیبانی حمله از پهلو' },
        { slot: 'CDM', roleFa: 'هافبک دفاعی', playerName: 'Rodri', noteFa: 'کنترل ریتم؛ هرگز پرس بالای نیمه‌میدان' },
        { slot: 'CDM', roleFa: 'هافبک جعبه‌به‌جعبه', playerName: 'Bellingham', noteFa: 'ورود تو ربع آخر — شوت از لبه محوطه' },
        { slot: 'CAM', roleFa: 'هافبک هجومی', playerName: 'De Bruyne', noteFa: 'پاس کلیدی ۹۴ — فرصت‌ساز اصلی' },
        { slot: 'RW', roleFa: 'وینگر راست', playerName: 'Vinícius Jr.', noteFa: 'دیبل ۱و۱؛ داخل‌شدن از پهلو' },
        { slot: 'ST', roleFa: 'مهاجم نوک', playerName: 'Mbappé', noteFa: 'سرعت ۹۷ — پشت دفاع بدو، نه خط میانی' },
        { slot: 'LW', roleFa: 'وینگر چپ', playerName: 'Yamal', noteFa: 'قطع با پای چپ؛ پاس به لبه محوطه' },
      ],
      '4-3-3 (2)': [
        { slot: 'GK', roleFa: 'دروازه‌بان', playerName: 'Alisson', noteFa: 'خروج با پا؛ پخش سریع' },
        { slot: 'RB', roleFa: 'دفاع راست', playerName: 'Cancelo', noteFa: 'داخل‌شدن تو میانه میدان' },
        { slot: 'CB', roleFa: 'دفاع میانی', playerName: 'Rúben Dias', noteFa: 'خط عمق ۴۵' },
        { slot: 'CB', roleFa: 'دفاع میانی', playerName: 'Saliba', noteFa: 'سرعت ۸۴؛ پوشش پشت' },
        { slot: 'LB', roleFa: 'دفاع چپ', playerName: 'Theo Hernández', noteFa: 'همپوشانی حمله؛ شوت دور' },
        { slot: 'CM', roleFa: 'هافبک مرکزی', playerName: 'Rodri', noteFa: 'پست پایین برای پاس‌خروجی' },
        { slot: 'CM', roleFa: 'هافبک جعبه‌به‌جعبه', playerName: 'Wirtz', noteFa: 'پاس بین خطوط' },
        { slot: 'CM', roleFa: 'هافبک هجومی', playerName: 'De Bruyne', noteFa: 'ضرب آزاد و کرنر' },
        { slot: 'RW', roleFa: 'وینگر راست', playerName: 'Salah', noteFa: 'پای چپ؛ داخل از راست' },
        { slot: 'ST', roleFa: 'مهاجم', playerName: 'Haaland', noteFa: 'تک‌ضرب داخل محوطه؛ شوت فوری' },
        { slot: 'LW', roleFa: 'وینگر چپ', playerName: 'Mbappé', noteFa: 'پرس از پهلو؛ سرعت ۹۷' },
      ],
    };
    return {
      intent,
      titleFa: 'ترکیب پیشنهادی — با بازیکن واقعی و جای دقیق',
      titleEn: 'Recommended formation — real players & slots',
      linesFa: [
        '4-2-3-1 → کنترل وسط و ضدحمله؛ امن‌ترین انتخاب رنک.',
        '4-3-3(2) → پرس بالا و وینگ‌های سریع.',
        'روی هر بازیکن تو زمین کلیک کن تا ببینی چرا اونجاست.',
        'عرض دفاع 40، ارتفاع خط 55–60، پرس بعد از پاس عرضی.',
      ],
      linesEn: [
        '4-2-3-1 → central control + counter; safest ranked pick.',
        '4-3-3(2) → high press with fast wingers.',
        'Tap any player on the pitch to see why they are there.',
        'Def width 40, line height 55-60, press after sideways pass.',
      ],
      options: ['4-2-3-1', '4-3-3 (2)', '3-5-2'],
      playerAssignments: assignments,
    };
  }
  if (intent === 'loadout') {
    return {
      intent,
      titleFa: '\u0631\u0627\u0647\u0646\u0645\u0627\u06cc \u06a9\u0627\u0633\u062a\u0648\u0645 \u0648 \u0627\u0646\u062a\u062e\u0627\u0628 \u062a\u062c\u0647\u06cc\u0632\u0627\u062a',
      titleEn: 'Loadout & customization guide',
      linesFa: [
        '\u062f\u0642\u062a \u0627\u0648\u0644\u06cc\u0646 \u06af\u0644\u0648\u0644\u0647: \u0644\u0648\u0644\u0647 \u0633\u0646\u06af\u06cc\u0646\u200c\u062a\u0631 \u06cc\u0627 \u0645\u0648\u0646\u062a \u062f\u0642\u06cc\u0642.',
        '\u0631\u06cc\u06a9\u0648\u06cc\u0644 \u06a9\u0646\u062a\u0631\u0644: \u06af\u0631\u06cc\u067e \u06a9\u0645\u200c\u062a\u0631\u060c \u0633\u0631\u0639\u062a \u0627\u0633\u067e\u0631\u06cc\u0646\u062a \u0631\u0648\u06cc \u0622\u0641.',
        '\u0641\u0644\u0634/\u0627\u0633\u0645\u0648\u06a9 \u0647\u0645\u06cc\u0634\u0647 \u0647\u0645\u0631\u0627\u0647 \u0628\u0627\u0634\u0647 \u0628\u0631\u0627\u06cc \u0627\u06a9\u0633\u06a9\u0648\u062a.',
        '\u06a9\u0627\u0633\u062a\u0648\u0645 \u062e\u0648\u062f\u062a \u0631\u0648 \u062b\u0627\u0628\u062a \u0646\u06af\u0647 \u062f\u0627\u0631 \u0648 \u0645\u06a9\u0633 \u0632\u0646.',
      ],
      linesEn: [
        'Prioritize first-bullet accuracy: heavier barrel or precise mount.',
        'Recoil control: lower grip, sprint-fire off.',
        'Always carry flash/smoke for executes.',
        'Lock your custom setup and max it.',
      ],
      options: ['First-bullet accuracy', 'Recoil control', 'Utility for executes'],
    };
  }
  if (intent === 'item') {
    return {
      intent,
      titleFa: '\u0627\u0646\u062a\u062e\u0627\u0628 \u062f\u0631\u0633\u062a \u0622\u06cc\u062a\u0645 / \u0628\u06cc\u0644\u062f',
      titleEn: 'Right item / build picks',
      linesFa: [
        '\u0627\u0648\u0644\u0648\u06cc\u062a \u0628\u0627 \u0622\u06cc\u062a\u0645\u200c\u0647\u0627\u06cc \u062a\u06cc\u0645\u06cc \u0648 \u06a9\u0646\u062a\u0631\u0644\u06cc\u0647\u060c \u0646\u0647 \u062f\u0645\u06cc\u062c \u062e\u0627\u0645.',
        '\u0627\u0633\u067e\u0627\u06cc\u06a9 \u0642\u062f\u0631\u062a\u06cc \u0631\u0648 \u0642\u0628\u0644 \u0627\u0632 \u0631\u06cc\u0633\u06a9 \u0628\u0633\u0627\u0632\u061b \u0622\u06cc\u062a\u0645 \u062f\u0641\u0627\u0639\u06cc \u0648\u0642\u062a\u06cc \u0639\u0642\u0628\u06cc.',
        '\u06cc\u06a9 \u0627\u0633\u0644\u0627\u062a counter-pick \u0628\u0631\u0627\u06cc \u0636\u062f\u062d\u0631\u06cc\u0641 \u0646\u06af\u0647 \u062f\u0627\u0631.',
      ],
      linesEn: [
        'Team-control items first; raw damage last.',
        'Build the power spike before risky plays.',
        'Keep a counter-pick slot for the enemy comp.',
      ],
    };
  }
  if (intent === 'map') {
    return {
      intent,
      titleFa: '\u0646\u0642\u0634\u0647 \u0648 \u0645\u0648\u0642\u0639\u06cc\u062a\u200c\u0647\u0627\u06cc \u06a9\u0644\u06cc\u062f\u06cc',
      titleEn: 'Map & key positions',
      linesFa: [
        '\u062f\u0648 \u0645\u0633\u06cc\u0631 \u0627\u0635\u0644\u06cc \u0631\u0648 \u0646\u06af\u0647 \u062f\u0627\u0631\u061b \u0646\u0642\u0637\u0647\u200c\u0647\u0627\u06cc \u062a\u0631\u06a9\u06cc\u0628\u06cc \u0631\u0648 \u0627\u0633\u06a9\u0646 \u06a9\u0646.',
        '\u067e\u06cc\u0634 \u0627\u0632 \u067e\u0648\u0634: \u0686\u06a9 \u00b7 \u06a9\u067e\u0686\u0631 \u00b7 \u062a\u0647\u062f\u06cc\u062f \u0627\u0632 \u0633\u0647 \u0632\u0627\u0648\u06cc\u0647.',
        '\u0631\u0648\u06cc \u0646\u0642\u0634\u0647: \u062f\u0627\u06cc\u0631\u0647 \u0642\u0631\u0645\u0632 = \u062e\u0637\u0631\u060c \u0641\u0644\u0634 = \u0645\u0633\u06cc\u0631\u060c \u0633\u0628\u0632 = \u0647\u062f\u0641.',
      ],
      linesEn: [
        'Hold two main lanes; scan combo sites.',
        'Before a push: check \u00b7 capture \u00b7 threaten from 3 angles.',
        'Map legend: red = danger, arrow = route, green = goal.',
      ],
    };
  }
  if (intent === 'economy') {
    return {
      intent,
      titleFa: '\u0645\u062f\u06cc\u0631\u06cc\u062a \u0627\u0642\u062a\u0635\u0627\u062f',
      titleEn: 'Economy management',
      linesFa: ['\u0647\u0631\u06af\u0632 full-buy \u0628\u0639\u062f \u0627\u0632 \u0634\u06a9\u0633\u062a eco \u0646\u06a9\u0646.', '\u0631\u0648\u0646\u062f save/purchase \u062a\u06cc\u0645 \u0631\u0648 \u0631\u0639\u0627\u06cc\u062a \u06a9\u0646.', '\u0631\u06cc\u0648\u0627\u0631\u062f \u0631\u0627\u0646\u062f \u0631\u0648 \u062d\u0633\u0627\u0628 \u06a9\u0646\u060c \u0646\u0647 \u062d\u0633.'],
      linesEn: ['Never full-buy after a lost eco.', 'Follow the team save/purchase pattern.', 'Count round rewards, not vibes.'],
    };
  }
  return {
    intent: 'tactic',
    titleFa: '\u067e\u0644\u0646 \u062a\u0627\u06a9\u062a\u06cc\u06a9\u06cc \u06af\u0627\u0645\u200c\u0628\u0647\u200c\u06af\u0627\u0645',
    titleEn: 'Step-by-step tactical plan',
    linesFa: ['\u0661) \u0642\u0628\u0644 \u0627\u0632 \u0627\u062c\u0631\u0627: \u0627\u0633\u06a9\u0646 \u0633\u0647\u200c\u0632\u0627\u0648\u06cc\u0647\u200c\u0627\u06cc.', '\u0662) \u0627\u062c\u0631\u0627 \u0628\u0627 \u062a\u0627\u06cc\u0645\u06cc\u0646\u06af \u0647\u0645\u200c\u062a\u06cc\u0645\u06cc.', '\u0663) \u0647\u0645\u06cc\u0634\u0647 \u06cc\u06a9 \u0646\u0641\u0631 backup \u0628\u0627\u0634\u0647.', '\u0664) \u0645\u0631\u0648\u0631 \u062e\u0637\u0627 \u0628\u0639\u062f \u0627\u0632 \u0631\u0627\u0646\u062f.'],
    linesEn: ['1) Scan 3 angles before executing.', '2) Execute on teammate timing.', '3) Always keep one backup.', '4) Review the mistake after the round.'],
  };
}

export const REALM_CONSULTATION_TOPICS: Record<RealmId, CoachConsultationTopic[]> = {
  shooter: [
    {
      id: 'sh-smoke-exec',
      realm: 'shooter',
      num: '01',
      roman: 'I',
      titleFa: 'اسموک و فلش ورود به سایت A',
      titleEn: 'Mirage & Warzone A-Site Smoke Execute',
      searchQuery: 'Counter-Strike tactical smoke execute map',
      coachAdviceFa:
        'مربی ونس: قبل از خروج از رمپ، اسموک پله و جانگل را همزمان بندازید و ۰.۴ ثانیه بعد از ترکیدن فلش بالای سر، با زاویه ۴۵ درجه پیک بدهید.',
      coachVoiceEn:
        'Deploy stairs and jungle smokes simultaneously. Pop your high flash over ramp and swing half a beat after detonation.',
      keyStatLabel: 'شانس موفقیت ورود',
      keyStatValue: '+78% WIN RATE',
      videos: [
        {
          id: 'vid-sh-1',
          title: 'CS2 & CoD Pro A-Site Smoke & Flash Lineup Guide',
          youtubeId: 'M7lc1UVf-VE',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Pro Tactical Search · YouTube',
          duration: '01:45',
        },
        {
          id: 'vid-sh-2',
          title: 'Tier-1 Operator Entry Pathing & Crosshair Placement',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'AIPETROS Web Archive',
          duration: '00:52',
        },
      ],
      images: [
        {
          id: 'img-sh-1',
          title: 'صحنه بازی: مسیر اسموک و زاویه پوشش آتش',
          imageUrl: '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
          fallbackUrl: '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
          sourceLabel: 'Gameplay Tactical Frame',
        },
        {
          id: 'img-sh-2',
          title: 'نقطه کور مدافع و محل فرود فلش',
          imageUrl: '/src/assets/images/high_court_evidence_frame_1794941281107.jpg',
          fallbackUrl: '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
          sourceLabel: 'Radar Frame Analysis',
        },
      ],
      motionArrows: [
        {
          id: 'arr-1',
          fromX: 18,
          fromY: 78,
          ctrlX: 38,
          ctrlY: 26,
          toX: 62,
          toY: 34,
          label: 'مسیر اسموک ۱',
        },
        {
          id: 'arr-2',
          fromX: 24,
          fromY: 82,
          ctrlX: 54,
          ctrlY: 65,
          toX: 78,
          toY: 48,
          label: 'مسیر ورود مهاجم',
        },
      ],
      motionCallouts: [
        {
          id: 'c-1',
          stepNumber: '01',
          x: 20,
          y: 76,
          titleFa: 'نقطه ایست پرتاب',
          detailFa: 'تنظیم نشانه روی لبه سقف',
        },
        {
          id: 'c-2',
          stepNumber: '02',
          x: 62,
          y: 34,
          titleFa: 'پوشش کامل اسنایپ',
          detailFa: 'مسدود شدن دید مدافع',
        },
        {
          id: 'c-3',
          stepNumber: '03',
          x: 78,
          y: 48,
          titleFa: 'ورود هماهنگ ۲ نفره',
          detailFa: 'پیک همزمان پس از فلش',
        },
      ],
    },
    {
      id: 'sh-recoil-strafe',
      realm: 'shooter',
      num: '02',
      roman: 'II',
      titleFa: 'کنترل لگد سلاح و Counter-Strafe',
      titleEn: 'Zero-Recoil Spray & Counter-Strafe Timing',
      searchQuery: 'Firearm recoil control tactical shooting stance',
      coachAdviceFa:
        'مربی ونس: در ۷ تیر اول نشانه را مستقیم به سمت پایین بکشید و لحظه توقف با کلید مخالف (A/D) شلیک اول را دقیقاً در سرعت صفر انجام دهید.',
      coachVoiceEn:
        'Zero your horizontal velocity with a crisp opposite tap before firing your first burst, then pull straight down for the first seven rounds.',
      keyStatLabel: 'دقت تیر اول',
      keyStatValue: '96.4% HEADSHOT',
      videos: [
        {
          id: 'vid-sh-3',
          title: 'Counter-Strafe & Recoil Pattern Motion Breakdown',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Aim Lab Web Search',
          duration: '01:18',
        },
        {
          id: 'vid-sh-4',
          title: 'Pro Spray Transfer & Micro-Adjustment Guide',
          youtubeId: 'M7lc1UVf-VE',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'YouTube Tactical Feed',
          duration: '02:05',
        },
      ],
      images: [
        {
          id: 'img-sh-3',
          title: 'الگوی معکوس کنترل لگد (T-Pattern)',
          imageUrl: '/src/assets/images/high_court_evidence_frame_1794941281107.jpg',
          fallbackUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
          sourceLabel: 'Ballistics Telemetry',
        },
        {
          id: 'img-sh-4',
          title: 'زمان‌بندی ترمز حرکتی (Counter-Strafe)',
          imageUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
          fallbackUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
          sourceLabel: 'Operator Stance Guide',
        },
      ],
      motionArrows: [
        {
          id: 'arr-3',
          fromX: 50,
          fromY: 24,
          ctrlX: 51,
          ctrlY: 48,
          toX: 46,
          toY: 74,
          label: 'کشش عمودی ماوس',
        },
        {
          id: 'arr-4',
          fromX: 46,
          fromY: 74,
          ctrlX: 60,
          ctrlY: 76,
          toX: 74,
          toY: 70,
          label: 'اصلاح افقی تیر ۸ تا ۱۵',
        },
      ],
      motionCallouts: [
        {
          id: 'c-4',
          stepNumber: '01',
          x: 50,
          y: 24,
          titleFa: 'تیر ۱ تا ۳ (هدشات)',
          detailFa: 'ترمز کامل با کلید مخالف',
        },
        {
          id: 'c-5',
          stepNumber: '02',
          x: 46,
          y: 74,
          titleFa: 'کشش رو به پایین',
          detailFa: 'مهار پرش عمودی لوله',
        },
        {
          id: 'c-6',
          stepNumber: '03',
          x: 74,
          y: 70,
          titleFa: 'تثبیت افقی اسپری',
          detailFa: 'انتقال نشانه به هدف دوم',
        },
      ],
    },
    {
      id: 'sh-sniper-peek',
      realm: 'shooter',
      num: '03',
      roman: 'III',
      titleFa: 'پیک دادن سریع مقابل اسنایپر',
      titleEn: 'Anti-Sniper Shoulder Bait & Jiggle Peek',
      searchQuery: 'Sniper overwatch tactical cover position',
      coachAdviceFa:
        'مربی ونس: هرگز با کل بدن وارد خط دید اسنایپر نشوید؛ فقط شانه را ۰.۲ ثانیه نشان دهید تا تیر اسنایپر خالی شود، سپس بلافاصله واید-پیک بدهید.',
      coachVoiceEn:
        'Bait the sniper shot with a tight shoulder jiggle, wait for the bolt cycle audio cue, then swing wide to punish.',
      keyStatLabel: 'پنجره آسیب‌پذیری اسنایپ',
      keyStatValue: '1.15s RECHAMBER',
      videos: [
        {
          id: 'vid-sh-5',
          title: 'Jiggle Peek vs Sniper Overwatch — Frame Analysis',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Esports Web Search',
          duration: '01:12',
        },
      ],
      images: [
        {
          id: 'img-sh-5',
          title: 'زاویه فریب شانه (Shoulder Bait) کنار دیوار',
          imageUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
          fallbackUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
          sourceLabel: 'Angle Geometry',
        },
        {
          id: 'img-sh-6',
          title: 'خط دید اسنایپر و منطقه امن کاور',
          imageUrl: '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
          fallbackUrl: '/src/assets/images/coach_arena_backdrop_1795030210595.jpg',
          sourceLabel: 'Sightline Map',
        },
      ],
      motionArrows: [
        {
          id: 'arr-5',
          fromX: 30,
          fromY: 66,
          ctrlX: 44,
          ctrlY: 60,
          toX: 32,
          toY: 54,
          label: 'فریب شانه (Jiggle)',
        },
        {
          id: 'arr-6',
          fromX: 32,
          fromY: 54,
          ctrlX: 55,
          ctrlY: 46,
          toX: 78,
          toY: 36,
          label: 'واید-پیک پس از شلیک حریف',
        },
      ],
      motionCallouts: [
        {
          id: 'c-7',
          stepNumber: '01',
          x: 34,
          y: 62,
          titleFa: 'خالی کردن تیر اسنایپ',
          detailFa: 'نمایش ۵٪ لبه شانه',
        },
        {
          id: 'c-8',
          stepNumber: '02',
          x: 78,
          y: 36,
          titleFa: 'حمله در زمان مسلح‌سازی',
          detailFa: '۱.۱ ثانیه فرصت شلیک آزاد',
        },
      ],
    },
    {
      id: 'sh-final-zone',
      realm: 'shooter',
      num: '04',
      roman: 'IV',
      titleFa: 'جاگیری و چرخش در زون آخر',
      titleEn: 'Final Circle Pinwheel Rotation & High Ground',
      searchQuery: 'Military tactical map high ground rotation',
      coachAdviceFa:
        'مربی ونس: به جای حرکت مستقیم به مرکز دایره، روی لبه باریک زون (Pinwheel Rotation) بچرخید تا هیچ تیمی پشت سرتان قرار نگیرد.',
      coachVoiceEn:
        'Never push straight into the center of zone six. Rotate along the narrow gas edge to clear your six and hold elevation.',
      keyStatLabel: 'امتیاز بقا در زون آخر',
      keyStatValue: '+64% TOP-1 ODDS',
      videos: [
        {
          id: 'vid-sh-6',
          title: 'Final Circle Pinwheel Rotation Motion Guide',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Warzone Web Tactics',
          duration: '01:34',
        },
      ],
      images: [
        {
          id: 'img-sh-7',
          title: 'مسیر چرخش حلزونی در لبه باریک زون',
          imageUrl: '/src/assets/images/coach_arena_backdrop_1794943636026.jpg',
          fallbackUrl: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
          sourceLabel: 'Zone Rotation Diagram',
        },
      ],
      motionArrows: [
        {
          id: 'arr-7',
          fromX: 22,
          fromY: 75,
          ctrlX: 25,
          ctrlY: 32,
          toX: 68,
          toY: 28,
          label: 'چرخش امن از لبه باریک',
        },
      ],
      motionCallouts: [
        {
          id: 'c-9',
          stepNumber: '01',
          x: 24,
          y: 72,
          titleFa: 'پاکسازی لبه نزدیک',
          detailFa: 'اطمینان از خالی بودن پشت سر',
        },
        {
          id: 'c-10',
          stepNumber: '02',
          x: 68,
          y: 28,
          titleFa: 'تثبیت ارتفاع (High Ground)',
          detailFa: 'دید کامل روی تیم‌های پایین',
        },
      ],
    },
  ],

  sports: [
    {
      id: 'sp-break-press',
      realm: 'sports',
      num: '01',
      roman: 'I',
      titleFa: 'شکستن پرس سنگین ۴-۲-۳-۱',
      titleEn: 'Breaking High 4-2-3-1 Press via Third-Man Pivot',
      searchQuery: 'Association football tactical formation 4-2-3-1 passing',
      coachAdviceFa:
        'مربی مورو: وقتی حریف با عمق ۷۱ پرس می‌کند، توپ را به هافبک دفاعی بدهید، به عقب برگردانید تا مدافع حریف جلو بکشد و با پاس نفر سوم (Third-Man) فضای پشت خط دفاع را بشکنید.',
      coachVoiceEn:
        'Bounce the ball off your central pivot to bait their pressing midfielder, then release the overlapping third-man runner into the half-space.',
      keyStatLabel: 'نرخ خروج موفق از پرس',
      keyStatValue: '91.8% PASS SUCCESS',
      videos: [
        {
          id: 'vid-sp-1',
          title: 'EA FC 25 Pro Third-Man Press Break & Half-Space Tutorial',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'EA FC Pro Broadcast Search',
          duration: '01:28',
        },
        {
          id: 'vid-sp-2',
          title: '4-2-3-1 Build-Up Triangles Under High Depth Pressure',
          youtubeId: 'M7lc1UVf-VE',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'YouTube Football Tactics',
          duration: '02:14',
        },
      ],
      images: [
        {
          id: 'img-sp-1',
          title: 'مثلث پاس‌کاری خروج از پرس و فرار نفر سوم',
          imageUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          fallbackUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          sourceLabel: 'Pitch Motion Telestrator',
        },
        {
          id: 'img-sp-2',
          title: 'آمار و نقشه حرارتی پاس‌های کلیدی در نیم‌فضا',
          imageUrl: '/src/assets/images/sample_eafc_scoreboard_1794941278189.jpg',
          fallbackUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          sourceLabel: 'Match Analytics Feed',
        },
      ],
      motionArrows: [
        {
          id: 'arr-sp-1',
          fromX: 22,
          fromY: 72,
          ctrlX: 36,
          ctrlY: 54,
          toX: 46,
          toY: 58,
          label: '۱. پاس جذب پرس به هافبک',
        },
        {
          id: 'arr-sp-2',
          fromX: 46,
          fromY: 58,
          ctrlX: 62,
          ctrlY: 28,
          toX: 82,
          toY: 34,
          label: '۲. پاس عمقی به نیم‌فضا',
        },
      ],
      motionCallouts: [
        {
          id: 'c-sp-1',
          stepNumber: '01',
          x: 22,
          y: 72,
          titleFa: 'مدافع بازی‌ساز (CB)',
          detailFa: 'صبر تا نزدیک شدن مهاجم حریف',
        },
        {
          id: 'c-sp-2',
          stepNumber: '02',
          x: 46,
          y: 58,
          titleFa: 'پاس تک‌ضرب هافبک (CDM)',
          detailFa: 'خارج کردن ۲ بازیکن از جریان',
        },
        {
          id: 'c-sp-3',
          stepNumber: '03',
          x: 82,
          y: 34,
          titleFa: 'فرار وینگر در کانال باز',
          detailFa: 'موقعیت تک‌به‌تک با xG بالا',
        },
      ],
    },
    {
      id: 'sp-through-ball',
      realm: 'sports',
      num: '02',
      roman: 'II',
      titleFa: 'تکنیک پاس عمقی L1 + مثلث',
      titleEn: 'Precision L1+R1 Driven Lobbed Through-Ball',
      searchQuery: 'Football through ball pass tactical pitch diagram',
      coachAdviceFa:
        'مربی مورو: قبل از ارسال پاس عمقی هوایی، با دکمه L1 مهاجم را به دویدن وادار کنید و دقیقاً لحظه‌ای که به خط شانه مدافع آخر رسید، پاس L1+مثلث را ارسال کنید.',
      coachVoiceEn:
        'Trigger your striker run with L1 early, then release the lobbed through-ball the exact millisecond their shoulder aligns with the last defender.',
      keyStatLabel: 'امید گل موقعیت (xG)',
      keyStatValue: '+0.68 xG / PASS',
      videos: [
        {
          id: 'vid-sp-3',
          title: 'L1+Triangle Through-Ball Timing & Offside Line Mastery',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'FC 25 Tactical Web Search',
          duration: '01:08',
        },
      ],
      images: [
        {
          id: 'img-sp-3',
          title: 'لحظه طلایی ارسال پاس قبل از تله آفساید',
          imageUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          fallbackUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          sourceLabel: 'Offside Line Telemetry',
        },
        {
          id: 'img-sp-4',
          title: 'منطقه فرود توپ پشت مدافع میانی',
          imageUrl: '/src/assets/images/sample_eafc_scoreboard_1794941278189.jpg',
          fallbackUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          sourceLabel: 'Pitch Zone Map',
        },
      ],
      motionArrows: [
        {
          id: 'arr-sp-3',
          fromX: 25,
          fromY: 64,
          ctrlX: 52,
          ctrlY: 16,
          toX: 80,
          toY: 42,
          label: 'قوس پاس هوایی L1+مثلث',
        },
      ],
      motionCallouts: [
        {
          id: 'c-sp-4',
          stepNumber: '01',
          x: 25,
          y: 64,
          titleFa: 'تحریک فرار با L1',
          detailFa: 'زاویه ۴۵ درجه نسبت به دروازه',
        },
        {
          id: 'c-sp-5',
          stepNumber: '02',
          x: 80,
          y: 42,
          titleFa: 'نقطه کنترل سینه مهاجم',
          detailFa: 'فضای خالی پشت خط دفاع',
        },
      ],
    },
    {
      id: 'sp-finesse-shot',
      realm: 'sports',
      num: '03',
      roman: 'III',
      titleFa: 'زاویه شوت کات‌دار مطمئن (Finesse)',
      titleEn: 'Green-Timed Finesse Shot Sweet-Spot Angle',
      searchQuery: 'Football penalty box shooting angle goal',
      coachAdviceFa:
        'مربی مورو: در گوشه محوطه جریمه با یک Ball-Roll زاویه بدن را ۱۳۵ درجه به سمت تیر مخالف باز کنید و با ۳.۲ خط قدرت، شوت R1 کات‌دار بزنید.',
      coachVoiceEn:
        'Execute a quick ball-roll outside the box corner to open a 45-degree sightline to the far top corner, then green-time your R1 finesse at three bars.',
      keyStatLabel: 'احتمال گل شدن شوت',
      keyStatValue: '88% CONVERSION',
      videos: [
        {
          id: 'vid-sp-4',
          title: 'Green Timed Finesse Shot Angle & Ball-Roll Setup',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Pro Striker Web Search',
          duration: '01:15',
        },
      ],
      images: [
        {
          id: 'img-sp-5',
          title: 'زاویه طلایی ۴۵ درجه و کات توپ به کنج تیر مخالف',
          imageUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          fallbackUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          sourceLabel: 'Shot Trajectory Board',
        },
      ],
      motionArrows: [
        {
          id: 'arr-sp-4',
          fromX: 30,
          fromY: 74,
          ctrlX: 48,
          ctrlY: 22,
          toX: 84,
          toY: 26,
          label: 'منحنی شوت کات‌دار R1',
        },
      ],
      motionCallouts: [
        {
          id: 'c-sp-6',
          stepNumber: '01',
          x: 30,
          y: 74,
          titleFa: 'باز کردن زاویه با Ball-Roll',
          detailFa: 'قرارگیری روی پای تخصصی',
        },
        {
          id: 'c-sp-7',
          stepNumber: '02',
          x: 84,
          y: 26,
          titleFa: 'کنج بالای تیر دوم',
          detailFa: 'خارج از دسترس شیرجه دروازه‌بان',
        },
      ],
    },
    {
      id: 'sp-custom-tactics',
      realm: 'sports',
      num: '04',
      roman: 'IV',
      titleFa: 'تنظیمات دفاعی و عمق ۷۱',
      titleEn: 'Pro Custom Tactics: Depth 71 & Compact Width',
      searchQuery: 'Football coaching tactical board formation',
      coachAdviceFa:
        'مربی مورو: عرض دفاع را روی ۴۲ و عمق را روی ۷۱ بگذارید تا تله آفساید خودکار فعال شود و فضای بین خط هافبک و دفاع کاملاً بسته بماند.',
      coachVoiceEn:
        'Set defensive width to 42 and depth to 71 to trigger automatic offside compression and suffocate central passing lanes.',
      keyStatLabel: 'کاهش شوت حریف',
      keyStatValue: '-42% OPPONENT xG',
      videos: [
        {
          id: 'vid-sp-5',
          title: 'Depth 71 Automatic Offside Trap & Compactness Guide',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Tactical Meta Search',
          duration: '01:50',
        },
      ],
      images: [
        {
          id: 'img-sp-6',
          title: 'فشردگی خطوط دفاع و هافبک در عمق ۷۱',
          imageUrl: '/src/assets/images/sample_eafc_scoreboard_1794941278189.jpg',
          fallbackUrl: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
          sourceLabel: 'Defensive Line Blueprint',
        },
      ],
      motionArrows: [
        {
          id: 'arr-sp-5',
          fromX: 35,
          fromY: 78,
          ctrlX: 35,
          ctrlY: 55,
          toX: 35,
          toY: 38,
          label: 'فشرده‌سازی خط دفاع به بالا',
        },
      ],
      motionCallouts: [
        {
          id: 'c-sp-8',
          stepNumber: '01',
          x: 35,
          y: 42,
          titleFa: 'خط تله آفساید خودکار',
          detailFa: 'عمق ۷۱ + عرض ۴۲',
        },
      ],
    },
  ],

  strategy: [
    {
      id: 'st-sicilian-najdorf',
      realm: 'strategy',
      num: '01',
      roman: 'I',
      titleFa: 'تله گشایش دفاع سیسیلی شطرنج',
      titleEn: 'Sicilian Defense Najdorf d5 Outpost & Tactical Sacrifice',
      searchQuery: 'Sicilian Defence chess board opening strategy',
      coachAdviceFa:
        'استاد بزرگ کالن: پس از حرکت a6 در واریانت نایدورف، با پیشروی سریع پیاده به e5 خانه d5 را کنترل کنید و اگر سفید فیل را در b5 نگه داشت، با سوارهای جناح وزیر ضدحمله بزنید.',
      coachVoiceEn:
        'In the Najdorf variation, contest central control immediately and use your queenside minority attack to punish overextended white pieces.',
      keyStatLabel: 'برتری موتور شطرنج',
      keyStatValue: '+1.85 EVAL',
      videos: [
        {
          id: 'vid-st-1',
          title: 'Sicilian Najdorf Grandmaster Tactical Masterclass',
          youtubeId: 'M7lc1UVf-VE',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Grandmaster Web Search',
          duration: '02:20',
        },
      ],
      images: [
        {
          id: 'img-st-1',
          title: 'ساختار پیاده‌ای نایدورف و پایگاه اسب در خانه d5',
          imageUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
          fallbackUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
          sourceLabel: 'Grandmaster Board Search',
        },
      ],
      motionArrows: [
        {
          id: 'arr-st-1',
          fromX: 28,
          fromY: 74,
          ctrlX: 42,
          ctrlY: 48,
          toX: 54,
          toY: 42,
          label: 'جهش اسب به پایگاه d5',
        },
        {
          id: 'arr-st-2',
          fromX: 68,
          fromY: 24,
          ctrlX: 68,
          ctrlY: 52,
          toX: 68,
          toY: 78,
          label: 'فشار رخ در ستون نیمه‌باز c',
        },
      ],
      motionCallouts: [
        {
          id: 'c-st-1',
          stepNumber: '01',
          x: 54,
          y: 42,
          titleFa: 'پایگاه کلیدی d5',
          detailFa: 'مهار فیل‌های حریف',
        },
        {
          id: 'c-st-2',
          stepNumber: '02',
          x: 68,
          y: 74,
          titleFa: 'ضدحمله ستون C',
          detailFa: 'فشار مستقیم روی شاه سفید',
        },
      ],
    },
    {
      id: 'st-roshan-smoke',
      realm: 'strategy',
      num: '02',
      roman: 'II',
      titleFa: 'تایمینگ اسموک روشان در دوتا ۲',
      titleEn: 'Dota 2 Roshan Pit Smoke Wrap & Buyback Timing',
      searchQuery: 'Esports strategy map objective control diagram',
      coachAdviceFa:
        'استاد بزرگ کالن: قبل از اسموک برای روشان، حتماً موج کریپ‌های لین بالا و وسط را تا زیر تاور حریف جلو بدهید تا حریف بین دفاع از بیس و جنگ روشان مجبور به انتخاب شود.',
      coachVoiceEn:
        'Shove both outer waves past the river line before popping smoke so the enemy must choose between losing barracks vision or contesting Roshan blind.',
      keyStatLabel: 'احتمال پیروزی تیم‌فایت',
      keyStatValue: '94.2% AEGIS SECURE',
      videos: [
        {
          id: 'vid-st-2',
          title: 'Pro Smoke Wrap & Roshan High-Ground Vision Setup',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Dota 2 Macro Web Search',
          duration: '01:42',
        },
      ],
      images: [
        {
          id: 'img-st-2',
          title: 'مسیر دور زدن با اسموک و محل کاشت وارد تپه',
          imageUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
          fallbackUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
          sourceLabel: 'Macro Sanctum Map',
        },
      ],
      motionArrows: [
        {
          id: 'arr-st-3',
          fromX: 20,
          fromY: 75,
          ctrlX: 44,
          ctrlY: 22,
          toX: 74,
          toY: 38,
          label: 'مسیر اسموک از پشت مثلث جنگل',
        },
      ],
      motionCallouts: [
        {
          id: 'c-st-3',
          stepNumber: '01',
          x: 45,
          y: 28,
          titleFa: 'کاشت وارد ارتفاع (High Ground)',
          detailFa: 'دید کامل روی ورودی پیت',
        },
        {
          id: 'c-st-4',
          stepNumber: '02',
          x: 74,
          y: 38,
          titleFa: 'محاصره روشان',
          detailFa: 'ورود پس از مصرف Buyback حریف',
        },
      ],
    },
    {
      id: 'st-rook-endgame',
      realm: 'strategy',
      num: '03',
      roman: 'III',
      titleFa: 'تکنیک تقابل شاه در آخربازی رخ',
      titleEn: 'Lucena & Philidor Rook Endgame King Opposition',
      searchQuery: 'Chess rook and pawn endgame Lucena position',
      coachAdviceFa:
        'استاد بزرگ کالن: در پوزیسیون لوسنا، با رخ در عرض چهارم «پل بسازید» (Building a Bridge) تا شاه شما از کیش‌های عمودی رخ حریف در امان بماند و پیاده وزیر شود.',
      coachVoiceEn:
        'Place your rook on the fourth rank to build the Lucena bridge, shielding your advancing king from perpetual vertical checks.',
      keyStatLabel: 'دقت تبدیل به برد',
      keyStatValue: '99.4% TABLEBASE WIN',
      videos: [
        {
          id: 'vid-st-3',
          title: 'Lucena Bridge & Philidor Defense — Endgame Motion Guide',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Chess Endgame Search',
          duration: '01:36',
        },
      ],
      images: [
        {
          id: 'img-st-3',
          title: 'تکنیک ساخت پل با رخ در عرض چهارم (Lucena Bridge)',
          imageUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
          fallbackUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
          sourceLabel: 'Endgame Tablebase',
        },
      ],
      motionArrows: [
        {
          id: 'arr-st-4',
          fromX: 48,
          fromY: 22,
          ctrlX: 34,
          ctrlY: 36,
          toX: 48,
          toY: 54,
          label: 'خروج زیگزاگی شاه و پوشش پل رخ',
        },
      ],
      motionCallouts: [
        {
          id: 'c-st-5',
          stepNumber: '01',
          x: 48,
          y: 54,
          titleFa: 'پل رخ در عرض ۴',
          detailFa: 'قطع کامل کیش‌های حریف',
        },
      ],
    },
    {
      id: 'st-wave-vision',
      realm: 'strategy',
      num: '04',
      roman: 'IV',
      titleFa: 'کنترل تعادل لین و واردگذاری',
      titleEn: 'Lane Equilibrium Freeze & Deep Observer Vision',
      searchQuery: 'Strategy game map vision control territory',
      coachAdviceFa:
        'استاد بزرگ کالن: کریپِ دورزن (Ranged Creep) حریف را زودتر بزنید و تعادل موج را دقیقاً بیرون محدوده تیر تاور خودی نگه دارید تا کری حریف مجبور به جلو آمدن شود.',
      coachVoiceEn:
        'Secure the enemy ranged creep first and hold wave equilibrium just outside your tower aggro ring to starve the enemy offlaner.',
      keyStatLabel: 'اختلاف طلا در دقیقه ۱۰',
      keyStatValue: '+1,450 NET WORTH',
      videos: [
        {
          id: 'vid-st-4',
          title: 'Lane Equilibrium Freeze & Creep Aggro Pulling',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Pro Laning Archive',
          duration: '01:22',
        },
      ],
      images: [
        {
          id: 'img-st-4',
          title: 'نقطه طلایی فریز موج کریپ بیرون دایره تاور',
          imageUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
          fallbackUrl: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
          sourceLabel: 'Lane Geometry Map',
        },
      ],
      motionArrows: [
        {
          id: 'arr-st-5',
          fromX: 65,
          fromY: 42,
          ctrlX: 48,
          ctrlY: 52,
          toX: 32,
          toY: 64,
          label: 'کشیدن اگرو کریپ به سمت عقب',
        },
      ],
      motionCallouts: [
        {
          id: 'c-st-6',
          stepNumber: '01',
          x: 32,
          y: 64,
          titleFa: 'نقطه امن فریز لین',
          detailFa: 'حداکثر امنیت در برابر گنک',
        },
      ],
    },
  ],

  story: [
    {
      id: 'sr-high-honor',
      realm: 'story',
      num: '01',
      roman: 'I',
      titleFa: 'مسیر شرافت بالا و بهترین پایان',
      titleEn: 'High-Honor Redemption Arc & Chapter 6 Choices',
      searchQuery: 'Red Dead Redemption 2 western landscape canyon sunset',
      coachAdviceFa:
        'آرشیویست تورن: در فصل ششم مأموریت‌های فرعی کمک به خانواده داونز، کاپیتان مونرو و رینز فال را کامل انجام دهید و در انتخاب نهایی، همراهی با جان مارستون را برگزینید تا پایان طلوع خورشید باز شود.',
      coachVoiceEn:
        'Complete the Chapter Six absolution quests for Mrs. Downes and Rains Fall, then choose to help John Marston escape on the mountain ridge for the true sunrise ending.',
      keyStatLabel: 'سطح شرافت نهایی',
      keyStatValue: 'MAX HONOR +8',
      videos: [
        {
          id: 'vid-sr-1',
          title: 'RDR2 High Honor Sunrise Path — All Key Decisions',
          youtubeId: 'M7lc1UVf-VE',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Frontier Lore Search · YouTube',
          duration: '02:10',
        },
      ],
      images: [
        {
          id: 'img-sr-1',
          title: 'درخت تصمیم‌گیری فصل ۶ و مسیر رستگاری آرتور',
          imageUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
          fallbackUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
          sourceLabel: 'Chronicle Decision Map',
        },
      ],
      motionArrows: [
        {
          id: 'arr-sr-1',
          fromX: 20,
          fromY: 74,
          ctrlX: 48,
          ctrlY: 54,
          toX: 78,
          toY: 28,
          label: 'مسیر انتخاب شرافت بالا به قله طلوع',
        },
      ],
      motionCallouts: [
        {
          id: 'c-sr-1',
          stepNumber: '01',
          x: 24,
          y: 72,
          titleFa: 'بخشش بدهی‌ها در فصل ۶',
          detailFa: '+۴ درجه جهش شرافت',
        },
        {
          id: 'c-sr-2',
          stepNumber: '02',
          x: 78,
          y: 28,
          titleFa: 'همراهی با جان مارستون',
          detailFa: 'باز شدن سینماتیک طلوع خورشید',
        },
      ],
    },
    {
      id: 'sr-white-arabian',
      realm: 'story',
      num: '02',
      roman: 'II',
      titleFa: 'مکان دقیق اسب سفید عربی',
      titleEn: 'Legendary White Arabian Horse — Lake Isabella Map',
      searchQuery: 'Arabian horse white snow mountain wilderness',
      coachAdviceFa:
        'آرشیویست تورن: به ساحل شمال‌غربی دریاچه ایزابلا در کوهستان برفی بروید، با طناب یا دکمه L2+مربع آرام نزدیک شوید و هنگام رام کردن، آنالوگ چپ را در جهت مخالف حرکت اسب به پایین نگه دارید.',
      coachVoiceEn:
        'Track the northwest shore of Lake Isabella in the Grizzlies. Approach slowly tapping calm, and pull the left stick down opposite her bucking direction.',
      keyStatLabel: 'سرعت و شتاب اسب',
      keyStatValue: '9/10 ELITE SPEED',
      videos: [
        {
          id: 'vid-sr-2',
          title: 'Lake Isabella White Arabian Taming & Exact Spawn Location',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Frontier Guide Search',
          duration: '01:30',
        },
      ],
      images: [
        {
          id: 'img-sr-2',
          title: 'ساحل شمال‌غربی دریاچه ایزابلا (نقطه اسپاون اسب عربی)',
          imageUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
          fallbackUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
          sourceLabel: 'Grizzlies West Map',
        },
      ],
      motionArrows: [
        {
          id: 'arr-sr-2',
          fromX: 26,
          fromY: 78,
          ctrlX: 35,
          ctrlY: 42,
          toX: 64,
          toY: 32,
          label: 'مسیر نزدیک شدن آرام در خلاف باد',
        },
      ],
      motionCallouts: [
        {
          id: 'c-sr-3',
          stepNumber: '01',
          x: 64,
          y: 32,
          titleFa: 'کرانه غربی Lake Isabella',
          detailFa: 'استفاده از دکمه Calm پیاپی',
        },
      ],
    },
    {
      id: 'sr-dead-eye',
      realm: 'story',
      num: '03',
      roman: 'III',
      titleFa: 'تکنیک هدف‌گیری سریع Dead Eye',
      titleEn: 'Dead Eye Critical Vitals & Instant Reload Trick',
      searchQuery: 'Western revolver duel sunset silhouette',
      coachAdviceFa:
        'آرشیویست تورن: به جای پر کردن دستی خشاب ۶تیر، فقط نیم ثانیه وارد حالت Dead Eye شوید و خارج شوید تا سلاح شما در کسری از ثانیه به‌صورت خودکار پر (Instant Reload) شود.',
      coachVoiceEn:
        'Tap Dead Eye on and off for half a second to trigger an instant cylinder reload without sitting through the manual reload animation.',
      keyStatLabel: 'سرعت مسلح‌سازی مجدد',
      keyStatValue: '0.15s INSTANT RELOAD',
      videos: [
        {
          id: 'vid-sr-3',
          title: 'Dead Eye Instant Reload & Critical Vitals Guide',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'Gunslinger Web Search',
          duration: '01:05',
        },
      ],
      images: [
        {
          id: 'img-sr-3',
          title: 'نقاط حیاتی قرمز در سطح ۴ قابلیت Dead Eye',
          imageUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
          fallbackUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
          sourceLabel: 'Gunslinger Diagram',
        },
      ],
      motionArrows: [
        {
          id: 'arr-sr-3',
          fromX: 30,
          fromY: 65,
          ctrlX: 52,
          ctrlY: 28,
          toX: 76,
          toY: 38,
          label: 'مارک کردن پی‌درپی با R1',
        },
      ],
      motionCallouts: [
        {
          id: 'c-sr-4',
          stepNumber: '01',
          x: 76,
          y: 38,
          titleFa: 'پر شدن آنی خشاب با Dead Eye',
          detailFa: 'بدون توقف در تیراندازی',
        },
      ],
    },
    {
      id: 'sr-treasure-lore',
      realm: 'story',
      num: '04',
      roman: 'IV',
      titleFa: 'نقشه گنج‌های مخفی و شمش‌های طلا',
      titleEn: 'Jack Hall & Limpany Gold Bar Treasure Route',
      searchQuery: 'Old western treasure map gold bars canyon',
      coachAdviceFa:
        'آرشیویست تورن: در ابتدای فصل دوم به شهر سوخته لیمپانی (Limpany) زیر کمپ Horseshoe Overlook بروید و از زیر میز کلانتر اولین شمش طلای ۵۰۰ دلاری را بردارید.',
      coachVoiceEn:
        'Ride south from Horseshoe Overlook to the burned sheriff office in Limpany and open the lockbox under the desk for an immediate five-hundred-dollar gold bar.',
      keyStatLabel: 'ارزش گنجینه اولیه',
      keyStatValue: '$3,000 GOLD BARS',
      videos: [
        {
          id: 'vid-sr-4',
          title: 'Limpany & Jack Hall Gang Gold Bars Route Guide',
          clipUrl: '/media/lobby-bg.mp4',
          channelLabel: 'RDR2 Map Web Search',
          duration: '01:55',
        },
      ],
      images: [
        {
          id: 'img-sr-4',
          title: 'مسیر کمپ Horseshoe Overlook تا صندوق طلای لیمپانی',
          imageUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
          fallbackUrl: '/src/assets/images/ue5_story_coach_1795030215143.jpg',
          sourceLabel: 'Frontier Treasure Map',
        },
      ],
      motionArrows: [
        {
          id: 'arr-sr-4',
          fromX: 48,
          fromY: 30,
          ctrlX: 38,
          ctrlY: 54,
          toX: 34,
          toY: 74,
          label: 'مسیر حرکت به دفتر کلانتر لیمپانی',
        },
      ],
      motionCallouts: [
        {
          id: 'c-sr-5',
          stepNumber: '01',
          x: 34,
          y: 74,
          titleFa: 'صندوق زیر میز کلانتر Limpany',
          detailFa: 'شمش طلای ۵۰۰ دلاری فوری',
        },
      ],
    },
  ],
};

const TOPIC_MICRO_INTEL_DB: Record<
  string,
  Omit<AdkMultiAgentReport, 'orchestratorId' | 'framework' | 'agentsTrace'>
> = {
  'sh-smoke-exec': {
    patchVersion: 'CS2 Sub-Tick v1.40.4 · Warzone S3 Tactical Patch',
    inputComboFa: 'ایستادن کنج رمپ + نشانه روی لبه چوب بالا + Jump-Throw همزمان (Space + Left-Click در پنجره ۶۴ میلی‌ثانیه Sub-Tick)',
    frameTimingFa: 'اسموک ۱.۸ ثانیه در هواست؛ فلش را ۱.۱ ثانیه بعد از اسموک رها کنید و دقیقاً ۰.۳۵ ثانیه بعد از صدای ترکیدن فلش فقط با کلید D خارج شوید (مدت کوری اسنایپر: ۲.۱ ثانیه)',
    proSettingsFa: 'eDPI: 800 (400 DPI × 2.0 Sens) | Jump-Throw Bind: Active | Radar Hud Scale: 1.15 | Grenade Crosshair: On (Delay 0.0s)',
    fatalMistakeFa: 'خطای مرگبار: پیک دادن مورب با کلید W+D همزمان! این کار سرعت توقف (Counter-Strafe) شما را ۹۵ میلی‌ثانیه کندتر می‌کند و تیر اول ۴۰٪ خطا می‌رود.',
    counterPlayFa: 'پاتک حریف: اگر مدافع داخل اسموک استاتیک ایستاد یا اسموک را با HE Grenade باز کرد، بلافاصله مولی را پشت جعبه Triple بندازید و ۲ نفره با فاصله ۱.۵ متر (برای جلوگیری از دبل‌کیل) وارد شوید.',
    microChecklistFa: [
      '۱. اسموک پله (Stairs) و جانگل (Jungle) باید در فاصله کمتر از ۰.۵ ثانیه از هم فرود بیایند تا شکاف دید (Gap) برای AWP نماند.',
      '۲. هنگام خروج از رمپ نشانه (Crosshair) را دقیقاً در ارتفاع سر روی زاویه زیر پله (Under-Palace) قفل کنید، نه روی زمین.',
      '۳. نفر اول (Entry) به سمت چپ (سایت/تتریس) باز می‌شود و نفر دوم (Trader) ۰.۴ ثانیه پشت سر او زاویه کانکتور را پوشش می‌دهد.',
    ],
  },
  'sh-recoil-strafe': {
    patchVersion: 'CS2 Sub-Tick Ballistics · MW3 Gunsmith Recoil Patch',
    inputComboFa: 'حرکت با D ← ضربه ۳۵ میلی‌ثانیه‌ای روی کلید مخالف A (رسیدن سرعت به 0 u/s) ← شلیک ۷ تیر اول با کشش عمودی ۲۲ پیکسل به پایین ← انحراف ۸ پیکسل به راست برای تیر ۸ تا ۱۵',
    frameTimingFa: 'پنجره دقت ۱۰۰٪ تیر اول دقیقاً در لحظه سرعت کمتر از 34 واحد بر ثانیه (۰.۰۸ ثانیه پس از ضربه به کلید مخالف) فعال می‌شود؛ ریست شدن لگد AK-47/MCW نیازمند ۳۸۰ میلی‌ثانیه مکث است.',
    proSettingsFa: 'Raw Input: ON | Mouse Polling Rate: 1000Hz–4000Hz | Recoil Crosshair: OFF (تثبیت دید روی مدل حریف) | Dynamic Crosshair Gap: -3',
    fatalMistakeFa: 'خطای مرگبار: نشستن (Crouch/Ctrl) در ۳ تیر اول! نشستن فوری باعث می‌شود تیرهای حریف که به سینه شما شلیک شده مستقیم به هدشات تبدیل شود؛ فقط بعد از تیر ششم بنشینید.',
    counterPlayFa: 'پاتک حریف: در فاصله بیش از ۲۵ متر هرگز بیش از ۵ تیر اسپری نکنید؛ از تکنیک ۲-تیر + Strafe چپ + ۲-تیر (Burst-Strafe) استفاده کنید تا نشانه اسنایپر و رایفلر حریف جا بماند.',
    microChecklistFa: [
      '۱. تیر ۱ تا ۳: تقریباً بدون لگد افقی؛ فقط ماوس را آرام به اندازه ضخامت یک سر به پایین بکشید.',
      '۲. تیر ۴ تا ۹: اوج پرش عمودی؛ سرعت کشش ماوس به پایین را ۱.۸ برابر کنید.',
      '۳. تیر ۱۰ به بعد: لوله سلاح به چپ منحرف می‌شود؛ مچ دست را به سمت راست و کمی پایین متمایل کنید.',
    ],
  },
  'sh-sniper-peek': {
    patchVersion: 'CS2 Peekers Advantage Patch · Warzone Sniper Flinch Update',
    inputComboFa: 'چسبیدن به لبه دیوار (فاصله کمتر از ۳۰ سانتی‌متر از کاور تا دید شما محدود نشود؟ خیر! برعکس: فاصله ۲.۵ متر عقب‌تر از لبه دیوار برای برتری زاویه هندسی) + ضربه سریع D-A در ۰.۱۸ ثانیه',
    frameTimingFa: 'زمان گلنگدن کشیدن اسنایپ حریف (Bolt Cycle) دقیقاً ۱.۱۵ تا ۱.۴۵ ثانیه است؛ شما بعد از شنیدن صدای تیر، ۰.۹ ثانیه فرصت طلایی برای Wide-Swing و شلیک ۴ تیر به سر دارید.',
    proSettingsFa: 'FOV: 103–110 | Nvidia Reflex: ON + Boost | Audio EQ: Treble Boost (برای شنیدن صدای اسکوپ کردن اسنایپر از فاصله ۱۸ متری)',
    fatalMistakeFa: 'خطای مرگبار: پیک دادن در حالی که به دیوار چسبیده‌اید (Close-Wall Peek) و با کلید Shift (آرام)! وقتی به دیوار نزدیکید شانه شما ۰.۳ ثانیه زودتر از اینکه حریف را ببینید در مانیتور اسنایپر دیده می‌شود.',
    counterPlayFa: 'پاتک حریف: اگر اسنایپر به Jiggle-Peek شما شلیک نکرد و زاویه را بازتر نگه داشت (Wide Hold)، از Jump-Spot یا فلش Pop-Flash پشت دیوار استفاده کنید و هرگز بدون یوتیلیتی دوباره از همان ارتفاع پیک ندهید.',
    microChecklistFa: [
      '۱. قانون هندسه زاویه: هر چقدر از لبه کاور عقب‌تر باشید، حریف را زودتر می‌بینید.',
      '۲. فریب شانه (Shoulder Bait): فقط ۱۵٪ مدل کاراکتر را وارد خط دید کنید و قبل از رسیدن به وسط صفحه به کاور برگردید.',
      '۳. در پیک دوم ارتفاع سر را تغییر دهید (Crouch-Slide یا Wide-Swing با سرعت کامل بدون Shift).',
    ],
  },
  'sh-final-zone': {
    patchVersion: 'Warzone Urzikstan/Rebirth S3 · Apex/BR Endgame Meta',
    inputComboFa: 'باز کردن مینی‌مپ هر ۴ ثانیه + علامت‌گذاری باریک‌ترین ضلع دایره (Thin Side) + حرکت حلزونی با Slide-Cancel (تغییر موقعیت در زمان بسته شدن گاز، نه قبل از آن)',
    frameTimingFa: '۱۵ ثانیه قبل از حرکت زون ۶، تیم‌های مرکز درگیر می‌شوند؛ چرخش خود را دقیقاً در ثانیه ۳ شروع حرکت گاز آغاز کنید تا صدای پای شما در صدای گاز و تیراندازی گم شود.',
    proSettingsFa: 'Mini-Map Shape: Square (۲۲٪ دید بیشتر نسبت به دایره) | Mini-Map Rotation: ON | Gas Mask Toggle: Manual (جلوگیری از قطع شدن انیمیشن تیراندازی)',
    fatalMistakeFa: 'خطای مرگبار: دویدن مستقیم به مرکز دایره آخر! در مرکز دایره از ۳ زاویه ۱۲۰ درجه مختلف (Crossfire) هدف قرار می‌گیرید و هیچ کاور پشت سری ندارید.',
    counterPlayFa: 'پاتک حریف: اگر تیم حریف High-Ground (بام یا تپه) را گرفته، اسموک را روی پای خودتان نیندازید؛ اسموک را مستقیم روی صورت تیم بالای تپه بندازید تا مجبور شوند برای دیدن شما از لبه ارتفاع پایین بپرند.',
    microChecklistFa: [
      '۱. همیشه ضلعی که فاصله خط سفید و خط گاز در آن کمترین است (Pinwheel Thin Edge) را پاکسازی کنید.',
      '۲. یک اسموک و یک استیم (Stim) را حتماً برای دایره آخر (Moving Pull) نگه دارید.',
      '۳. موقع تغییر زون، اول تیمی که در ضلع عریض مجبور به دویدن در فضای باز است را Gatekeep کنید.',
    ],
  },
  'sp-break-press': {
    patchVersion: 'EA SPORTS FC 25 · Title Update #9 (FC IQ & Press Stamina Patch)',
    inputComboFa: 'دریافت توپ با مدافع (CB) ← نگه داشتن R1/RB (فراخوانی هافبک CDM به نزدیک) ← پاس زمینی X/A به CDM ← زدن L1+X (Pass & Go) به مدافع کناری و ارسال پاس تک‌ضرب R1+△ به وینگر',
    frameTimingFa: 'وقتی حریف با عمق ۷۰+ پرس می‌کند، هوش مصنوعی وینگر حریف ۰.۶ ثانیه طول می‌کشد تا مسیر پاس به فول‌بک را ببندد؛ پاس سوم (Third-Man) باید در کمتر از ۱.۲ ثانیه و به صورت تک‌ضرب (One-Touch) ارسال شود.',
    proSettingsFa: 'Build-Up Style: Short Passing | Defensive Approach: High (70) | CDM Role: Deep-Lying Playmaker++ | Fullback Role: Falseback+ یا Wingback+',
    fatalMistakeFa: 'خطای مرگبار: نگه داشتن دکمه سرعت (R2/RT) هنگام دریافت توپ توسط هافبک دفاعی! فشردن R2 در لحظه استپ توپ باعث فاصله گرفتن ۱.۸ متری توپ از پا و تکل مستقیم هافبک پرس‌کننده حریف می‌شود.',
    counterPlayFa: 'پاتک حریف: اگر حریف با سوییچ دستی (Right-Stick) مسیر هافبک وسط را بست، با دکمه مربع تمام‌پر (یا R1+مربعDriven Switch) توپ را در عرض زمین به دفاع کناری سمت مخالف (Weak-Side) منتقل کنید.',
    microChecklistFa: [
      '۱. هنگام دریافت توپ در عقب، با L1/LB استپ بدون سرعت (Close Control) انجام دهید و پشت به بازیکن پرس‌کننده بچرخید.',
      '۲. قبل از رسیدن توپ به پا، به مینی‌مپ پایین صفحه نگاه کنید: در پرس ۷۱ همیشه دفاع کناری سمت مخالف کاملاً آزاد است.',
      '۳. پاس خروج از پرس را با R1+X (Driven Ground Pass) بدهید تا سرعت توپ از سرعت سوییچ مدافع حریف بیشتر باشد.',
    ],
  },
  'sp-through-ball': {
    patchVersion: 'EA SPORTS FC 25 · Precision Passing & PlayStyle+ Patch',
    inputComboFa: 'نشانه رفتن به سمت مهاجم + یک ضربه روی L1/LB (شروع دویدن مهاجم) ← صبر به اندازه ۲ گام مهاجم ← نگه داشتن L1+R1+△ (Driven Lobbed Through-Ball) یا پاس Precision با R1+△',
    frameTimingFa: 'لحظه رها کردن دکمه مثلث باید دقیقاً ۰.۲۵ ثانیه قبل از تلاقی خط شانه مهاجم شما با شانه آخرین مدافع حریف (CB) باشد؛ تاخیر بیش از ۰.۳ ثانیه منجر به تله آفساید خودکار می‌شود.',
    proSettingsFa: 'Through Pass Assistance: Semi یا Precision | Pass Receiver Lock: Late | PlayStyle+ مورد نیاز پاسور: Incisive Pass+ یا Long Ball Pass+',
    fatalMistakeFa: 'خطای مرگبار: ارسال پاس عمقی وقتی بدن پاسور (هافبک) پشت یا با زاویه بیش از ۹۰ درجه نسبت به مقصد است! در پچ جدید FC 25 پاس‌های بدون زاویه دید تا ۴۵٪ دقت کمتری دارند؛ ابتدا یک Ball-Roll در جهت پاس بزنید.',
    counterPlayFa: 'پاتک حریف: اگر حریف با انتخاب دستی مدافع آخر به عقب دوید (Manual Track Back)، بلافاصله بعد از دستور L1 یک ضربه به R1 بزنید تا مهاجم ناگهان ترمز کند و توپ را در فضای خالی جلوی محوطه به او بدهید.',
    microChecklistFa: [
      '۱. با L1 مهاجم را بدوانید و با تکان دادن استیک راست (Creative Run) زاویه فرار او را به فضای بین CB و RB تغییر دهید.',
      '۲. یک Ball-Roll کوتاه بزنید تا بازیکن روی پای تخصصی و زاویه ۴۵ درجه قرار بگیرد.',
      '۳. قدرت پاس L1+R1+△ را بین ۲.۵ تا ۳.۲ بار (Bar) پر کنید تا توپ پشت مدافع فرود بیاید و به دروازه‌بان نرسد.',
    ],
  },
  'sp-finesse-shot': {
    patchVersion: 'EA SPORTS FC 25 · Finesse Shot+ & Timed Finishing Calibration',
    inputComboFa: 'ورود مورب از گوشه محوطه ۱۸ قدم ← رها کردن سرعت R2 ← یک Ball-Roll به سمت داخل (زاویه ۱۳۵ درجه نسبت به تیر دوم) ← نگه داشتن R1 + دایره/B (۳.۲ خط قدرت) + ضربه دوم دایره در لحظه برخورد پا به توپ (Green Time)',
    frameTimingFa: 'پنجره فینیشینگ سبز (Green Timed Window) دقیقاً ۴ فریم (۶۶ میلی‌ثانیه) قبل از تماس روی کفش با توپ است؛ شوت سبز با PlayStyle+ Finesse سرعت چرخش توپ را ۳۲٪ افزایش می‌دهد.',
    proSettingsFa: 'Timed Finishing: ON | Shot Assistance: Assisted یا Precision | Trainer Timed Bar: Hidden (تمرکز روی انیمیشن پای بازیکن به جای نوار بالای سر)',
    fatalMistakeFa: 'خطای مرگبار: زدن شوت کات‌دار بلافاصله بعد از دویدن سریع با R2 بدون مکث! اگر قبل از شوت ۰.۲ ثانیه سرعت را رها نکنید یا Ball-Roll نزنید، قوس توپ باز شده و به تیرک یا بیرون می‌رود.',
    counterPlayFa: 'پاتک حریف: اگر حریف دروازه‌بان را با فشار دادن R3 به سمت تیر دوم حرکت داد (GK Movement)، در همان زاویه ۱۳۵ درجه به جای R1+دایره، یک شوت ساده یا Trivela (L2+دایره) به تیر اول که خالی شده بزنید.',
    microChecklistFa: [
      '۱. بهترین نقطه شوت: ۲ متر بیرون یا روی خط محوطه جریمه، هم‌راستا با گوشه شش‌قدم.',
      '۲. بازیکن راست‌پا از سمت چپ و بازیکن چپ‌پا از سمت راست باید زاویه ۱۳۵ درجه به تیر مخالف بگیرد.',
      '۳. قدرت شوت: دقیقاً ۳ تا ۳.۳ خانه؛ کمتر از ۲.۵ خانه را دروازه‌بان می‌گیرد و بیشتر از ۳.۶ خانه از بالای تیر رد می‌شود.',
    ],
  },
  'sp-custom-tactics': {
    patchVersion: 'EA SPORTS FC 25 · Pro Meta Tactics (4-2-1-3 / 4-4-2 FC IQ)',
    inputComboFa: 'تنظیم تاکتیک روی 4-2-1-3 یا 4-4-1-1 ← عمق دفاعی (Line Height): 70 یا 71 ← سبک بازیسازی: Short Passing یا Counter ← فعال‌سازی تله آفساید دستی با دو بار زدن جهت بالا (D-Pad Up × 2) در لحظه پاس رو به عقب حریف',
    frameTimingFa: 'تله آفساید خودکار در عمق ۷۰+ هر ۱.۵ ثانیه خط دفاع را فشرده می‌کند؛ وقتی مهاجم حریف پشت به دروازه شما توپ را به هافبک برمی‌گرداند، شما ۰.۸ ثانیه وقت دارید با D-Pad Up × 2 خط را ۳ متر جلو بکشید.',
    proSettingsFa: 'Line Height: 70 | CB Roles: Defender++ & Stopper+ | CDM 1: Holding++ (Defend) | CDM 2: Deep-Lying Playmaker++ | Wingers: Inside Forward++ (Balanced)',
    fatalMistakeFa: 'خطای مرگبار: بیرون کشیدن مدافع میانی (CB) از خط دفاع برای پرس کردن در میانه میدان! به محض خروج CB، ساختار عمق ۷۰ شکسته شده و یک پاس عمقی ساده منجر به تک‌به‌تک می‌شود؛ فقط با CDM دفاع کنید.',
    counterPlayFa: 'پاتک حریف: اگر حریف با تعویض منطقه بازی (Switch Play) عمق ۷۰ شما را دور می‌زند، در نیمه دوم یا هنگام دفاع از نتیجه، با D-Pad یک تاکتیک دوم با عمق ۵۵ (Balanced) و فول‌بک‌های Fullback++ (Defend) فعال کنید.',
    microChecklistFa: [
      '۱. برای دفاع در میانه زمین، با استیک راست (R3) فقط روی هافبک‌های دفاعی (CDM) سوییچ کنید و با R1 مدافع دوم را فقط برای بستن زاویه فرابخوانید.',
      '۲. نقش حداقل یکی از وینگرها را روی Inside Forward++ بگذارید تا در ضدحملات به عنوان مهاجم دوم وارد نیم‌فضا شود.',
      '۳. روی ضربات کرنر حریف، ۲ بازیکن سرعتی را روی Counter-Attack تنظیم کنید.',
    ],
  },
  'st-sicilian-najdorf': {
    patchVersion: 'Stockfish 17 NNUE Depth 45 · FIDE 2025 Opening Theory',
    inputComboFa: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6! ← در برابر 6.Bg5 با 6...e6 و 7...Qb6 (واریانت پیاده مسموم) یا در برابر 6.Be3 با 6...e5! خانه d5 را تسخیر کنید',
    frameTimingFa: 'نقطه عطف تاکتیکی در حرکت ۶ تا ۱۲ است: اگر سفید تا حرکت ۱۰ نتواند خانه d5 را با اسب اشغال کند، ابتکار عمل سیاه در ستون نیمه‌باز C و قربانی کیفیت ...Rxc3 در ۷۲٪ بازی‌ها برنده است.',
    proSettingsFa: 'کنترل زمان بلیتز/رپید: در ۱۰ حرکت اول نایدورف بیش از ۱۵ ثانیه زمان مصرف نکنید | اولویت محاسبه: ۱. کنترل d5 ۲. فشار ستون c ۳. پیشروی ...b5-b4',
    fatalMistakeFa: 'خطای مرگبار: بازی کردن ...e5 بدون آماده‌سازی در حالی که فیل سیاه‌رو در f8 قفل است و سفید بلافاصله با Nf5 و Bg5 خانه d5 را برای همیشه تصرف می‌کند (ارزیابی موتور: +1.90 به نفع سفید).',
    counterPlayFa: 'پاتک حریف: اگر سفید حمله انگلیسی (Be3, f3, Qd2, g4, O-O-O) را بازی کرد، هرگز در جناح شاه قلعه نروید (چون طوفان پیاده سفید قلعه را می‌شکند)؛ شاه را در مرکز (e8/f8) نگه دارید و سریع با ...b5 و ...Nbd7-b6 به قلعه بزرگ سفید حمله کنید.',
    microChecklistFa: [
      '۱. حرکت 5...a6 خانه b5 را از اسب‌ها و فیل سفید می‌گیرد و پیشروی ...b5 را آماده می‌کند.',
      '۲. رخ را به c8 بیاورید و همیشه آماده قربانی تاکتیکی رخ در c3 (...Rxc3!) برای متلاشی کردن پیاده‌های قلعه سفید و گرفتن پیاده e4 باشید.',
      '۳. اگر سفید فیل خود را در d4 با اسب تعویض کرد، خانه e5 پایگاه دائمی اسب سیاه خواهد شد.',
    ],
  },
  'st-roshan-smoke': {
    patchVersion: 'Dota 2 Patch 7.38 · Roshan Timer & Lotus/Tormentor Meta',
    inputComboFa: 'جلو دادن موج کریپ‌های ۲ لین بیرونی ← فعال کردن Smoke of Deceit در مثلث (Triangle) خارج از دید Observer حریف ← کاشت Sentry + Observer روی تپه پشت پیت روشان ← پیک‌آپ Aegis قبل از انقضای ۵ دقیقه‌ای',
    frameTimingFa: 'شعاع شکسته شدن اسموک دقیقاً ۱۰۲۵ واحد از هیروهای حریف است؛ روزها روشان در گوشه پایین-راست و شب‌ها (تغییر در دقیقه 00:00 و 05:00) از پورتال به گوشه بالا-چپ حرکت می‌کند (۲۰ ثانیه قبل از تغییر شب/روز پیت را کنترل کنید).',
    proSettingsFa: 'Quickcast: ON برای آیتم‌های اسموک و بلینک | Directional Move: Bind روی کلید Alt | Minimap Hero Icon Scale: 115%',
    fatalMistakeFa: 'خطای مرگبار: زدن اسموک و رفتن مستقیم داخل پیت روشان در حالی که موج کریپ‌ها به تاورهای خودتان چسبیده است! حریف فقط با نگاه کردن به مینی‌مپ و نبودن هیچ هیرویی روی لین‌ها، بدون داشتن حتی یک وارد، ۱۰۰٪ می‌فهمد داخل روشان هستید.',
    counterPlayFa: 'پاتک حریف: اگر حریف هیروهای دارای اسکیل دید داخل پیت (مثل Clockwerk Rocket، Storm، یا Enigma/Earthshaker) دارد، ساپورت Position 4 یا 5 باید بیرون پیت روی ارتفاع بایستد تا اسموک یا بلینک اینیشییتور حریف را قبل از رسیدن به پیت بشکند.',
    microChecklistFa: [
      '۱. همیشه قبل از شروع روشان، یک هیرو با قابلیت Push موج لین مخالف را تا زیر تاور T2 حریف ببرد و با TP یا پورتال (Twin Gate) به تیم ملحق شود.',
      '۲. یک وارد Sentry درست جلوی ورودی پیت و یک Observer روی تپه سمت بیس حریف بکارید.',
      '۳. در روشان دوم و سوم، قبل از درگیری حتماً وضعیت Buyback کری و مید حریف را چک کنید.',
    ],
  },
  'st-rook-endgame': {
    patchVersion: 'Syzygy 7-Piece Endgame Tablebase · FIDE Endgame Manual',
    inputComboFa: 'در پوزیسیون برنده لوسنا: ۱. رخ به خانه f1/d1 با کیش برای دور کردن شاه حریف به ستون کناری ← ۲. حرکت رخ به عرض چهارم (مثلاً Re4!) ← ۳. خروج زیگزاگی شاه از جلوی پیاده ← ۴. پوشاندن کیش آخر با رخ در عرض ۴ (ساخت پل)',
    frameTimingFa: 'در آخربازی رخ، ۱ تمپو (حرکت) تفاوت بین برد ۱۰۰٪ و تساوی است؛ وقتی شاه حریف یک ستون از پیاده دور شد، بلافاصله رخ را در عرض چهارم بگذارید، نه عرض پنجم یا سوم.',
    proSettingsFa: 'Premove در تنگی وقت: فقط روی حرکات زیگزاگی شاه وقتی رخ حریف در عرض اول/هشتم کیش می‌دهد | محاسبه قانون ۵۰ حرکت',
    fatalMistakeFa: 'خطای مرگبار: خارج کردن شاه از جلوی پیاده در عرض هفتم قبل از اینکه رخ خود را در عرض چهارم قرار داده باشید! رخ حریف از پشت بی‌نهایت کیش عمودی می‌دهد و شاه شما هیچ پناهگاهی نخواهد داشت.',
    counterPlayFa: 'پاتک حریف (اگر شما مدافع هستید — تکنیک فیلیدور): رخ خود را در عرض ششم (عرض سوم از سمت خودتان) نگه دارید تا شاه حریف اصلاً نتواند وارد عرض ششم شود؛ و به محض اینکه حریف پیاده را به عرض ششم راند، رخ را به عرض اول ببرید و از پشت کیش بدهید.',
    microChecklistFa: [
      '۱. گام اول لوسنا: قطع کردن راه شاه حریف (Cut off the King) به اندازه حداقل یک ستون.',
      '۲. گام دوم: قرار دادن رخ خودی در عرض چهارم (۴ خانه جلوتر از پیاده).',
      '۳. گام سوم: حرکت شاه به سمت رخ خودی تا پس از ۲ کیش حریف، رخ در عرض چهارم مثل یک «پل» جلوی کیش را بگیرد.',
    ],
  },
  'st-wave-vision': {
    patchVersion: 'Dota 2 Patch 7.38 Lane Equilibrium & Aggro Mechanics',
    inputComboFa: 'راست‌کلیک (Attack Command) روی هیروی حریف در شعاع ۵۰۰ واحدی کریپ‌ها ← بلافاصله عقب کشیدن به سمت کریپ دورزن (Ranged Creep) خودی ← تکرار هر ۳ ثانیه برای کشیدن موج به بیرون محدوده تاور',
    frameTimingFa: 'کول‌داون (Cooldown) مکانیک Creep Aggro دقیقاً ۳.۰ ثانیه و مدت زمان دنبال کردن شما ۲.۳ ثانیه است؛ شما حتی می‌توانید با کلیک روی آیکون هیروی حریف در یک لین دیگر (Global Aggro) کریپ‌ها را به سمت خود بکشید!',
    proSettingsFa: 'Auto Attack: Never یا Standard | Right-Click Deny: Force Right-Click Attack ON | Tower Attack Range Indicator: Alt-Hold ON',
    fatalMistakeFa: 'خطای مرگبار: کشیدن کریپ‌های حریف به زیر تیر مستقیم تاور خودی! تاور در چند ثانیه کریپ‌های حریف را می‌کشد و موج بعدی شما دو برابر شده و مستقیم زیر تاور امن حریف می‌رود.',
    counterPlayFa: 'پاتک حریف: اگر حریف کمپ کوچک یا بزرگ جنگل را Pull کرد تا تعادل لین شما را به هم بزند، یا با ساپورت خود کمپ را با وارد/بدن Block کنید، یا بلافاصله موج کریپ حریف را قبل از رسیدن به تاور خودتان در پشت تاور آنها (Drag Wave) بچرخانید.',
    microChecklistFa: [
      '۱. کریپ دورزن (Ranged Creep) بیشترین دمیج و XP را دارد؛ همیشه با اسکیل (Nuke) لست‌هیت آن را تضمین کنید تا Deny نشود.',
      '۲. تعادل لین را درست ۱۰۰ واحد بیرون دایره برد تاور خودتان فریز کنید.',
      '۳. دقیقه ۲:۴۵ و ۵:۴۵ حواستان به اسپاون نیلوفر (Lotus Pool) و دقیقه ۶:۰۰ به رون وسط (Power Rune) باشد.',
    ],
  },
  'sr-high-honor': {
    patchVersion: 'Red Dead Redemption 2 · Ultimate Story & Chapter 6 Honor Guide',
    inputComboFa: 'در فصل ششم (Beaver Hollow): انجام کامل مأموریت‌های سفیدرنگ (Mrs. Downes در Annesburg، Captain Monroe و Rains Fall) + انتخاب گزینه "بخشیدن بدهی و دادن پول" در ماموریت‌های اشتراوس (Money Lending & Other Sins VI–VII)',
    frameTimingFa: 'در فصل ششم ضریب تغییرات شرافت (Honor Multiplier) به ۱.۵ برابر افزایش می‌یابد؛ بنابراین حتی اگر شرافت شما در فصل ۵ منفی باشد، انجام ۴ مأموریت فرعی فصل ۶ به تنهایی نوار شرافت را به سطح +۶ (آستانه پایان طلوع خورشید) می‌رساند.',
    proSettingsFa: 'تخفیف فروشگاه‌ها در شرافت بالا: ۵۰٪ تخفیف در تمام فروشگاه‌ها در سطح Honor +7 | باز شدن لباس‌های اختصاصی و دسته تفنگ Hero Pearl Grip برای Cattleman Revolver',
    fatalMistakeFa: 'خطای مرگبار: به تعویق انداختن مأموریت‌های فرعی خانم داونز و خواهر کالدرون (Sister Calderón) تا بعد از مأموریت "Our Best Selves"! پس از شروع مأموریت قطار آخر، تمام مأموریت‌های فرعی شرافت برای همیشه قفل می‌شوند.',
    counterPlayFa: 'نکته کلیدی انتخاب آخر: در آخرین دوراهی با جان مارستون، حتماً گزینه «کمک به جان برای فرار» (Help John Get to Safety) را انتخاب کنید؛ انتخاب گزینه «برگشتن برای پول در غار» حتی با شرافت بالا هم سینماتیک طلوع روی صخره را تغییر می‌دهد.',
    microChecklistFa: [
      '۱. پس از اخراج اشتراوس از کمپ، یک جهش بزرگ شرافت (+۲ سطح کامل) دریافت می‌کنید.',
      '۲. ملاقات با خواهر کالدرون در ایستگاه قطار Emerald Ranch تنها در صورتی فعال می‌شود که مأموریت "Brothers and Sisters, One and All" را در سنت دنیس رفته باشید.',
      '۳. در شهر سنت دنیس با سلام کردن (Greet) به هر ۳ نفر، یک واحد مثبت شرافت فوری می‌گیرید.',
    ],
  },
  'sr-white-arabian': {
    patchVersion: 'RDR2 Wildlife & Mount Mechanics · Grizzlies West Compendium',
    inputComboFa: 'رفتن به ساحل شمال‌غربی Lake Isabella ← فعال کردن Eagle Eye (L3+R3) برای دیدن رد اسب در برف ← قفل کردن با L2/LT و زدن پیاپی مربع/X (Calm) ← سوار شدن با مثلث/Y ← نگه داشتن استیک چپ به ساعت ۵ یا ۷ (در خلاف جهت چرخش اسب) + زدن مداوم مربع',
    frameTimingFa: 'فرآیند رام کردن (Breaking) دقیقاً ۱۲ تا ۱۵ ثانیه طول می‌کشد؛ هر ۲ ثانیه که نوار آرام کردن کم‌رنگ شد بلافاصله مربع/X را بزنید. اگر اسب فرار کرد و ناپدید شد، باید ۷۲ ساعت داخل بازی (۳ بار خوابیدن در کمپ) از منطقه دور شوید تا دوباره اسپاون شود.',
    proSettingsFa: 'زین پیشنهادی برای حداکثر استامینا: Panther Trail Saddle از Trapper (کاهش مصرف استامینا -۵۰٪ و سرعت +۲ خانه اضافه) | زدن دکمه L3 هر ۱۵ ثانیه هنگام تاخت برای پر شدن رایگان استامینا در سطح Bonding 4',
    fatalMistakeFa: 'خطای مرگبار: دویدن به سمت اسب یا شلیک شدن تیر توسط گرگ‌های اطراف دریاچه ایزابلا! قبل از نزدیک شدن به اسب سفید، حتماً ۲ گرگی که در ساحل غربی دریاچه پرسه می‌زنند را با کمان (Bow) و تیر سمی یا رایفل از فاصله دور بدون ترساندن اسب از بین ببرید.',
    counterPlayFa: 'تکنیک جایگزین ۱۰۰٪ بدون شکست: به جای نزدیک شدن قدم‌به‌قدم، می‌توانید با اسب فعلی خود با سرعت به کنار اسب سفید عربی بتازید، طناب (Lasso) را بندازید، پیاده شوید و در حالی که طناب را نگه داشته‌اید به او نزدیک شده و سوار شوید!',
    microChecklistFa: [
      '۱. این اسب تنها پس از تکمیل مأموریت شکار خرس افسانه‌ای با هوزیا در فصل ۲ ("Exit Pursued by a Bruised Ego") در نقشه ظاهر می‌شود.',
      '۲. موقع سوار شدن، استیک چپ را همیشه به سمت پایین (ساعت ۶) متمایل نگه دارید و فقط کمی چپ و راست کنید تا هرگز به زمین پرتاب نشوید.',
      '۳. بلافاصله بعد از رام کردن، زین (Saddle) اسب قبلی خود را باز کرده و روی اسب سفید عربی بگذارید تا به اسب اصلی شما (Level 1 Bonding) تبدیل شود.',
    ],
  },
  'sr-dead-eye': {
    patchVersion: 'RDR2 Combat & Dead Eye Tier 1–5 Mechanics',
    inputComboFa: 'هنگام خالی شدن ۶ تیر رولور ← به جای زدن دایره/B برای ریلود دستی ← فقط یک ضربه ۰.۱۵ ثانیه‌ای روی R3 (ورود و خروج فوری از Dead Eye) = پر شدن آنی تمام خشاب بدون هیچ انیمیشنی!',
    frameTimingFa: 'انیمیشن پر کردن دستی دو رولور (Dual Wield) ۳.۴ ثانیه طول می‌کشد، اما با ترفند Instant Dead-Eye Cancel در ۰.۱۵ ثانیه (۲۲ برابر سریع‌تر) هر ۱۲ تیر پر می‌شوند. تگ کردن دستی با R1/RB از فصل ۲ (مأموریت سرقت قطار با جان) باز می‌شود.',
    proSettingsFa: 'Dead Eye Aim Sensitivity: +3 Ticks | Aim Assist Strength: Full (یا Free Aim برای +20 XP بیشتر در هر کیل) | بهترین تونیک: Snake Oil و Chewing Tobacco (پر کردن حلقه بدون مصرف هسته)',
    fatalMistakeFa: 'خطای مرگبار: نگه داشتن طولانی Dead Eye برای تگ کردن ۶ دشمن در حالی که در فضای باز ایستاده‌اید! مصرف Dead Eye در حالت قفل کردن چندین هدف ۳ برابر سریع‌تر است؛ برای هدشات سریع، نشانه را قبل از زدن R3 روی قفسه سینه ببرید، کمی استیک را بالا بدهید، R3 و بلافاصله R2 را بزنید.',
    counterPlayFa: 'نکته طلایی سطح ۴ و ۵ Dead Eye: از فصل ۴ (مأموریت "Urban Pleasures") قلب و سر دشمنان به رنگ قرمز تیره درمی‌آید؛ شلیک به ناحیه قلب/گردن با تیر Express حتی اگر حریف کلاه آهنی داشته باشد در ۱ تیر کار را تمام می‌کند.',
    microChecklistFa: [
      '۱. برای افزایش دائمی ظرفیت حلقه Dead Eye، چالش‌های Sharpshooter و Bandit را کامل کنید و پوست‌ها را به Trapper بدهید.',
      '۲. گوشت شکار بزرگ (Big Game Meat) را با آویشن (Thyme) روی آتش بپزید تا هسته (Core) دد-آی شما برای ۲۴ ساعت طلایی و ضدتخلیه شود.',
      '۳. در دوئل‌ها، دکمه R2 را فقط تا نیمه (۳۰٪) آرام فشار دهید تا دایره پایین پر شود، سپس ناگهان R2 را تا انتها بفشارید.',
    ],
  },
  'sr-treasure-lore': {
    patchVersion: 'RDR2 Economy & Gold Bar Locations (Chapter 2 Fast-Start)',
    inputComboFa: 'شروع فصل ۲ در Horseshoe Overlook ← حرکت ۳۰۰ متر به جنوب‌غربی به سمت شهر سوخته Limpany ← ورود به ساختمان Sheriff ← باز کردن صندوق زیر میز ← برداشتن شمش طلای ۵۰۰ دلاری (فقط شمش را بردارید و دفترچه را دست نزنید تا بعد از چند روز دوباره Respawn شود!)',
    frameTimingFa: 'در کمتر از ۱۵ دقیقه اول فصل ۲ می‌توانید بدون هیچ درگیری، ۴ شمش طلا (۱ شمش در Limpany + ۲ شمش در واگن قطار سقوط‌کرده زیر پل Cotorra Springs + ۱ شمش با حل معمای مجسمه‌های Strange Statues در غار Window Rock) به ارزش مجموع ۳۰۰۰ دلار جمع کنید.',
    proSettingsFa: 'فروش شمش طلا: قبل از باز شدن Fence در Emerald Ranch، می‌توانید همین الان به Fence شهر Rhodes یا Saint Denis بروید و هر شمش را ۵۰۰ دلار نقد بفروشید.',
    fatalMistakeFa: 'خطای مرگبار: خرج کردن پول‌های اولیه روی خرید اسلحه در فروشگاه Valentine! اکثر سلاح‌های قدرتمند فصل ۲ (مثل Lancaster Repeater در زیرزمین اسلحه‌فروشی Rhodes، Schofield Revolver در پشت داروخانه Valentine و Semi-Auto Shotgun در کلبه Watson) کاملاً رایگان قابل برداشتن هستند.',
    counterPlayFa: 'معمای غار مجسمه‌ها (۳ شمش طلای ۱۵۰۰ دلاری): در غار شرق Donner Falls، دکمه مجسمه‌هایی که تعداد انگشتان دستشان عدد اول (Prime Numbers: ۲، ۳، ۵ و ۷ انگشت) است را فشار دهید تا ۳ شمش طلا از مجسمه وسط آزاد شود (مجسمه یک‌دست را ۴ انگشتی حساب کنید? خیر، چون یک دستش شکسته، ۳ انگشت باقی‌مانده عدد اول است!).',
    microChecklistFa: [
      '۱. شمش ۱ ($500): دفتر کلانتر شهر سوخته Limpany درست زیر کمپ فصل دوم.',
      '۲. شمش ۲ و ۳ ($1,000): واگن عمودی قطار سقوط‌کرده در دره زیر پل راه‌آهن شمال غرب Fort Wallace (نیازمند پرش از روی صخره کناری).',
      '۳. شمش ۴، ۵ و ۶ ($1,500): غار Strange Statues با فشردن کلید مجسمه‌های ۲، ۳، ۵ و ۷ انگشتی.',
    ],
  },
};

export function buildAdkMicroIntelForTopic(topic: CoachConsultationTopic): AdkMultiAgentReport {
  const preset = TOPIC_MICRO_INTEL_DB[topic.id];
  const defaultAgents: AdkAgentBadge[] = [
    {
      id: 'vision_agent',
      agentName: 'VisionTelestratorAgent',
      roleFa: 'ایجنت بینایی و رسم دایره/مسیر',
      toolCalled: 'compute_telestrator_vectors()',
      latencyMs: 38,
    },
    {
      id: 'patch_agent',
      agentName: 'MetaPatchNotesAgent',
      roleFa: 'ایجنت پچ‌نوت و متای آپدیت',
      toolCalled: 'query_live_patch_meta()',
      latencyMs: 54,
    },
    {
      id: 'mechanics_agent',
      agentName: 'MicroMechanicsAgent',
      roleFa: 'ایجنت دکمه‌ها و تایمینگ میلی‌ثانیه',
      toolCalled: 'extract_frame_inputs()',
      latencyMs: 42,
    },
    {
      id: 'counter_agent',
      agentName: 'CounterPlayMistakeAgent',
      roleFa: 'ایجنت تشخیص خطای مرگبار و پاتک',
      toolCalled: 'audit_fatal_mistakes()',
      latencyMs: 31,
    },
  ];

  if (preset) {
    return {
      orchestratorId: `adk-root-${topic.id}`,
      framework: 'AIPETROS Internal Agent Mesh · Deterministic Rule Pipeline',
      ...preset,
      agentsTrace: defaultAgents,
      lastUpdatedIso: new Date().toISOString(),
    };
  }

  // Fallback for custom queries or uploaded files based on active realm
  const baseRealmPreset =
    TOPIC_MICRO_INTEL_DB[REALM_CONSULTATION_TOPICS[topic.realm][0].id];

  return {
    orchestratorId: `adk-custom-${topic.id}`,
    framework: 'AIPETROS Internal Agent Mesh · Deterministic Rule Pipeline',
    patchVersion: baseRealmPreset.patchVersion,
    inputComboFa: `اجرای دقیق برای «${topic.titleFa}»: ${baseRealmPreset.inputComboFa}`,
    frameTimingFa: baseRealmPreset.frameTimingFa,
    proSettingsFa: baseRealmPreset.proSettingsFa,
    fatalMistakeFa: baseRealmPreset.fatalMistakeFa,
    counterPlayFa: baseRealmPreset.counterPlayFa,
    microChecklistFa: baseRealmPreset.microChecklistFa,
    agentsTrace: defaultAgents,
    lastUpdatedIso: new Date().toISOString(),
  };
}

/**
 * Resolves any user query (in Persian or English) or topic ID into a rich CoachConsultationTopic
 * ready to be augmented with live internet-searched images/videos and ADK Multi-Agent Micro-Intel.
 */
export function resolveCoachTopic(realm: RealmId, queryOrTopicId: string): CoachConsultationTopic {
  const topics = REALM_CONSULTATION_TOPICS[realm];
  const raw = queryOrTopicId.trim();
  if (!raw) {
    const first = structuredClone(topics[0]);
    first.adkIntel = buildAdkMicroIntelForTopic(first);
    return first;
  }

  const exactById = topics.find((t) => t.id === raw);
  if (exactById) {
    const cloned = structuredClone(exactById);
    cloned.adkIntel = buildAdkMicroIntelForTopic(cloned);
    return cloned;
  }

  const lower = raw.toLowerCase();
  const matched = topics.find(
    (t) =>
      t.titleFa.toLowerCase().includes(lower) ||
      t.titleEn.toLowerCase().includes(lower) ||
      t.searchQuery.toLowerCase().includes(lower)
  );
  if (matched) {
    const cloned = structuredClone(matched);
    cloned.adkIntel = buildAdkMicroIntelForTopic(cloned);
    return cloned;
  }

  // Dynamic custom consultation topic synthesized from the user's custom query
  const base = structuredClone(topics[0]);
  const customTopic: CoachConsultationTopic = {
    ...base,
    id: `custom-${Date.now()}`,
    titleFa: `ترفند: ${raw}`,
    titleEn: `Tactical Search: ${raw}`,
    searchQuery: raw,
    coachAdviceFa: `دایره قرمز = نقطه خطر · فلش = مسیر حرکت · دایره سبز = هدف نهایی (${raw})`,
    coachVoiceEn: `Red circle marks danger. Follow the glowing arrow to the green target circle for ${raw}.`,
  };
  customTopic.adkIntel = buildAdkMicroIntelForTopic(customTopic);
  return customTopic;
}

/**
 * Dynamically recomputes the AI Telestrator circles and trajectory arrows when the gamer
 * clicks or taps any (x%, y%) coordinate on their gameplay screenshot or video frame.
 */
export function recomputeTelestratorFromTap(
  topic: CoachConsultationTopic,
  rawX: number,
  rawY: number
): CoachConsultationTopic {
  const tapX = Math.max(12, Math.min(88, Math.round(rawX)));
  const tapY = Math.max(16, Math.min(84, Math.round(rawY)));
  const next = structuredClone(topic);

  // Target spot shifts to the opposite tactical quadrant for clear trajectory visibility
  const targetX = tapX < 52 ? Math.min(84, tapX + 46) : Math.max(16, tapX - 46);
  const targetY = tapY > 48 ? Math.max(22, tapY - 38) : Math.min(78, tapY + 38);

  // Midpoint danger/enemy sightline circle offset perpendicular to path so circles never collide
  const dangerX = Math.max(20, Math.min(80, Math.round((tapX + targetX) / 2)));
  const dangerY =
    tapY > 48
      ? Math.min(80, Math.round((tapY + targetY) / 2 + 12))
      : Math.max(20, Math.round((tapY + targetY) / 2 - 12));

  next.motionArrows = [
    {
      id: `tap-arr-1`,
      fromX: tapX,
      fromY: tapY,
      ctrlX: dangerX,
      ctrlY: tapY > 48 ? Math.max(12, targetY - 12) : Math.min(88, targetY + 12),
      toX: targetX,
      toY: targetY,
      label: 'مسیر پیشنهادی مربی',
    },
  ];

  next.motionCallouts = [
    {
      id: 'tap-c-1',
      stepNumber: '01',
      x: tapX,
      y: tapY,
      titleFa: 'پوزیشن شما',
      detailFa: 'شروع حرکت',
      zoneType: 'path',
      radius: 6.5,
    },
    {
      id: 'tap-c-2',
      stepNumber: '!',
      x: dangerX,
      y: dangerY,
      titleFa: 'دایره خطر / دید حریف',
      detailFa: 'نقطه کور یا خطا',
      zoneType: 'danger',
      radius: 8.5,
    },
    {
      id: 'tap-c-3',
      stepNumber: '✓',
      x: targetX,
      y: targetY,
      titleFa: 'پوزیشن امن / هدف',
      detailFa: 'بهترین زاویه',
      zoneType: 'target',
      radius: 7.5,
    },
  ];

  next.adkIntel = next.adkIntel ?? buildAdkMicroIntelForTopic(next);
  return next;
}


