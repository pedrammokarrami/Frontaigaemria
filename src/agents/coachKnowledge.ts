import type { RealmId } from '../types/spatial.ts';

/**
 * AIPETROS Coach Knowledge Base — deterministic, structured teaching library.
 * Every topic carries: multilingual keywords, core lessons, drills,
 * common mistakes and pro references. Agents compose answers from real
 * chunks of this library + the user's actual telemetry — never canned jokes.
 */

export interface CoachKnowledgeTopic {
  id: string;
  realm: RealmId | 'cross';
  titleFa: string;
  titleEn: string;
  keywords: string[];
  lessonsFa: string[];
  lessonsEn: string[];
  drills: string[];
  mistakesFa: string[];
  proRef: string;
}

const KB: CoachKnowledgeTopic[] = [
  /* ---------------- shooter ---------------- */
  {
    id: 'sh-aim',
    realm: 'shooter',
    titleFa: 'ایم‌پلی و تمرین تیراندازی',
    titleEn: 'Aim Training & Flicking',
    keywords: ['aim', 'flick', 'crosshair', 'tracking', 'تیرانداز', 'ایم', 'کروس', 'نشانه‌گیری'],
    lessonsFa: [
      'کروس‌هیر همیشه در ارتفاع سر حریف نگه دار؛ ۹۰٪ دوئل‌های برد‌شده قبل از شلیک برده شده‌اند.',
      'تمرین روزانه ۱۵ دقیقه: ۵ دقیقه tracking، ۵ دقیقه flick، ۵ دقیقه target-switching.',
      'حساسیت را پایین بیا تا جایی که هنوز ۱۸۰ درجه با یک حرکت مچ راحت باشد؛ ثبات > سرعت.',
    ],
    lessonsEn: [
      'Pre-aim at head level — most duels are won before the first shot.',
      'Daily 15-min routine: 5 tracking, 5 flicking, 5 target switching.',
      'Lower sensitivity until a 180° wrist turn stays smooth; consistency beats raw speed.',
    ],
    drills: ['Aim Trainer Flick Grid', '10s Tracking Ladder', 'Counter-Strafe Box Drill'],
    mistakesFa: ['اسپری طولانی بی‌کنترل', 'ایم به سینه به‌جای سر', 'تغییر مداوم حساسیت'],
    proRef: 'Optic/Navi aim routines — 60% micro-adjust, 40% flick.',
  },
  {
    id: 'sh-crosshair',
    realm: 'shooter',
    titleFa: 'کروس‌هیر پلیسمنت',
    titleEn: 'Crosshair Placement',
    keywords: ['placement', 'corner', 'peek', 'زاویه', 'گوشه', 'پلیسمنت'],
    lessonsFa: [
      'کروس‌هیر را همیشه روی لبه‌ی زاویه‌ی بعدی قفل کن؛ با هر قدم، خط پیش‌نشانی را جابه‌جا کن.',
      'هرگز با کروس‌هیر وسط راهرو قدم نزن؛ اتاق‌ها را با پیش‌ایم روشن کن.',
    ],
    lessonsEn: [
      'Lock the crosshair on the next angle edge; re-index with every step.',
      'Never walk mid-corridor with an idle crosshair; pre-clear rooms.',
    ],
    drills: ['Pre-Aim Room Clear', 'Corner Peeking Ladder'],
    mistakesFa: ['نگاه به زمین هنگام چرخش', 'واک‌شات بدون پیش‌ایم'],
    proRef: 'CS pro demo review — crosshair frozen on angle 95% of rotate time.',
  },
  {
    id: 'sh-econ',
    realm: 'shooter',
    titleFa: 'اقتصاد و خرید تیمی',
    titleEn: 'Economy & Buy Discipline',
    keywords: ['economy', 'buy', 'eco', 'force', 'اقتصاد', 'خرید', 'فول'],
    lessonsFa: [
      'قانون طلایی: اگر ۳ نفر تیم سلاح کامل ندارند، eco بزن؛ خرید تقسیم‌شده یعنی باخت دور.',
      'بعد از باخت اکو، دور بعد را با SMG و utility کامل بگیر؛ ریسک محاسبه‌شده بهتر از فول امل است.',
    ],
    lessonsEn: [
      'If 3+ teammates lack a full buy, eco together; split buys lose rounds.',
      'After a lost bonus round, buy SMG + full utility instead of desperate full rifles.',
    ],
    drills: ['Eco Round Discipline Scrim'],
    mistakesFa: ['خرید منفرد وسط دور تیمی', 'نگرفتن utility حتی در اکو'],
    proRef: 'Tier-1 teams keep a shared bank sheet per half.',
  },
  {
    id: 'sh-util',
    realm: 'shooter',
    titleFa: 'استفاده از ابزار (گرنید/تیکتیکال)',
    titleEn: 'Utility Usage',
    keywords: ['smoke', 'flash', 'util', 'nade', 'utility', 'گرنید', 'دود', 'فلاش'],
    lessonsFa: [
      'هر اجرا با دود شروع می‌شود؛ خط دید حریف را قطع کن بعد وارد شو.',
      'فلاش را پرتاب کنید که teammate آن را ببیند نه حریف؛ pop-flash روی زاویه‌ی تنگ.',
    ],
    lessonsEn: [
      'Open every execute with a smoke that cuts the defender’s sightline.',
      'Bounce flashes for teammates, pop-flash only into tight angles.',
    ],
    drills: ['Lineup Rep Session', 'Smoke Execute Scrim'],
    mistakesFa: ['فلاش زدن تیم خودی', 'هدر دادن دود بدون پلن'],
    proRef: 'One smoke = one new angle; two smokes = one safe plant.',
  },
  {
    id: 'sh-comms',
    realm: 'shooter',
    titleFa: 'کامنیکیشن تیمی',
    titleEn: 'Team Communication',
    keywords: ['comms', 'callout', 'team', 'voice', 'گفتگو', 'کال', 'تیمی'],
    lessonsFa: [
      'کال‌شورت کوتاه: موقعیت + تعداد + سلامتی؛ بدون داستان.',
      'هرگز بعد از مرگ، در حالت نگرانی حرف نزن؛ اطلاعات بده نه احساس.',
    ],
    lessonsEn: [
      'Short calls: location + count + HP; no stories.',
      'After death give info, not emotion.',
    ],
    drills: ['Comms Discipline Scrim'],
    mistakesFa: ['داد زدن روی هرباک', 'کال نکردن موقعیت چرخش حریف'],
    proRef: 'IGL pattern: call → confirm → execute in under 3 seconds.',
  },
  {
    id: 'sh-movement',
    realm: 'shooter',
    titleFa: 'حرکت و کانتر-استرِیف',
    titleEn: 'Movement & Counter-Strafe',
    keywords: ['movement', 'strafe', 'peek', 'jiggle', 'حرکت', 'استرِیف'],
    lessonsFa: [
      'قبل از شلیک توقف کامل — counter-strafe با کلید مخالف؛ دقت شات بی‌حرکت دو برابر است.',
      'jiggle-peek برای اطلاعات، wide-peek فقط با فلاش.',
    ],
    lessonsEn: [
      'Full stop before shooting — counter-strafe with the opposite key.',
      'Jiggle for info; wide-peek only with a flash.',
    ],
    drills: ['Counter-Strafe Box Drill', 'Jiggle Timing Trainer'],
    mistakesFa: ['شلیک وسط حرکت', 'crouch-peek عادتی'],
    proRef: '95ms is the meta counter-strafe window.',
  },

  /* ---------------- sports (football) ---------------- */
  {
    id: 'sp-throughball',
    realm: 'sports',
    titleFa: 'پاس در عمق و تایمینگ',
    titleEn: 'Through-Ball Timing',
    keywords: ['pass', 'through', 'ball', 'assist', 'پاس', 'عمق', 'اسیست'],
    lessonsFa: [
      'پاس در عمق را نیم‌ضربان دیر بده، نه زود — دفاع مرکزی باید گام بردارد.',
      'L1/R1 به مهاجم دستور دویدن پشت خط می‌دهد؛ اول حرکت، بعد پاس.',
    ],
    lessonsEn: [
      'Delay the through-ball half a beat — wait for the CB to step.',
      'Trigger the run first (L1/R1), release the pass second.',
    ],
    drills: ['Through-Ball Lane Drill', 'Third-Man Run Reps'],
    mistakesFa: ['پاس به پا به‌جای فضا', 'پاس وقتی مهاجم آفساید چرخش کرده'],
    proRef: 'Elite playmakers release 0.3s later than amateurs feel is right.',
  },
  {
    id: 'sp-defense',
    realm: 'sports',
    titleFa: 'دفاع و خط دوم',
    titleEn: 'Defensive Shape',
    keywords: ['defense', 'press', 'line', 'defen', 'دفاع', 'پرس', 'خط'],
    lessonsFa: [
      'با دومین مدافع جلوی مسیر پاس بایست، با مدافع دستی فشار بده؛ عجله = شکست خط.',
      'بعد دقیقه ۷۵، پرس دستی نفر دوم را کم کن و خطوط مرکزی را نگه دار.',
    ],
    lessonsEn: [
      'Cut passing lanes with the second defender; rush only with the controlled one.',
      'After minute 75 drop the manual second-man press, hold central lanes.',
    ],
    drills: ['Defensive Setup & 71 Depth Line', 'Lane-Cutting Rondo'],
    mistakesFa: ['سprint با مدافع آخر', 'پرس بی‌پشتیبانی'],
    proRef: 'Metas reward patience: 71-depth lines concede 30% less.',
  },
  {
    id: 'sp-finishing',
    realm: 'sports',
    titleFa: 'گلزنی و فینیشینگ',
    titleEn: 'Finishing & Timed Shots',
    keywords: ['shoot', 'finish', 'goal', 'finesse', 'شوت', 'گل', 'فینس'],
    lessonsFa: [
      'شوت تایم‌شده (سبز) با زاویه‌ی بسته بهتر از شوت قدرتی وسط دروازه‌بان است.',
      'finesse از زاویه‌ی چپ با پای چپ به دور دروازه؛ یار جداشده را خلبان کن.',
    ],
    lessonsEn: [
      'Green-timed shots with tight angles beat power shots at the keeper.',
      'Finesse from the left channel with the far foot, curling away from the keeper.',
    ],
    drills: ['Green-Timed Finesse Curler', '1v1 Keeper Ladder'],
    mistakesFa: ['شوت با پای ضعیف از زاویه‌ی بسته', 'شلیک بدون تنظیم بدن'],
    proRef: 'Green window is wider while moving toward goal, not sideways.',
  },
  {
    id: 'sp-press',
    realm: 'sports',
    titleFa: 'پرس تیمی و انتقال',
    titleEn: 'Team Press & Transitions',
    keywords: ['press', 'transition', 'counter', 'پرس', 'ضدحمله', 'انتقال'],
    lessonsFa: [
      'پرس را بعد از پاس عرضی یا بک‌پس شروع کن؛ خطر بول‌آپ کمینه می‌شود.',
      'باختی: اول ۱۵ ثانیه آرامش، بعد press؛ واکنش احساسی گل می‌خورد.',
    ],
    lessonsEn: [
      'Trigger the press after a sideways/back pass — safest window.',
      'After conceding: 15 calm seconds first, then press; emotional reactions concede again.',
    ],
    drills: ['Transition Trigger Scrim'],
    mistakesFa: ['پرس از خط دفاع با شتاب', 'دویدن همه به سمت توپ'],
    proRef: 'Press triggers: bad touch, back pass, sideline trap.',
  },
  {
    id: 'sp-setpiece',
    realm: 'sports',
    titleFa: 'استاندارد و کرنر',
    titleEn: 'Set Pieces',
    keywords: ['corner', 'free', 'kick', 'penalty', 'کرنر', 'ضربه', 'پنالتی'],
    lessonsFa: [
      'کرنر کوتاه با نفر دوم، درصد گل بالاتری از کرنر مستقیم شلوغ دارد.',
      'پنالتی: قدم آرام، نگاه به دروازه‌بان، شوت پایین گوشه.',
    ],
    lessonsEn: [
      'Short corners with a second man outperform crowded direct ones.',
      'Penalties: slow approach, watch the keeper, low to the corner.',
    ],
    drills: ['Set-Piece Reps'],
    mistakesFa: ['پنالتی قدرتی وسط', 'کرنر مستقیم هر بار'],
    proRef: 'Short-corner conversion ~2x direct at high levels.',
  },

  /* ---------------- strategy (chess/RTS) ---------------- */
  {
    id: 'sp-formation',
    realm: 'sports',
    titleFa: 'فرماسیون و ترکیب تیم',
    titleEn: 'Formation & Team Setup',
    keywords: ['formation', 'lineup', 'setup', 'squad', 'فرماسیون', 'ترکیب', 'چینش', 'سیستم', '4213', '4231', '4321'],
    lessonsFa: [
      'بهترین فرماسیون به سبک بازی تو بستگی داره: 4-2-3-1 برای کنترل وسط، 4-3-3 برای پرس بالا و وینگ‌های سریع، 4-2-1-3 برای فشار حداکثری.',
      'در فرماسیون‌های سه نفره میانی همیشه یک هافبک دفاعی (CDM) بمونه تا ضدحمله نخوری.',
      'تاکتیک سفارشی: عرض دفاع ۴۰، ارتفاع خط ۶۰، پرس بعد از پاس عرضی و پوشش میانی برای قطع پاس بین خطوط.',
    ],
    lessonsEn: [
      'Best formation depends on your style: 4-2-3-1 for central control, 4-3-3 for high press with fast wingers, 4-2-1-3 for max pressure.',
      'In 3-man midfields always keep one CDM home or counters will punish you.',
      'Custom tactics: defense width 40, line height 60, press after a sideways pass, and between-the-lines coverage on the CM.',
    ],
    drills: ['Formation Fit Scrim', 'Custom Tactics Reps'],
    mistakesFa: ['کپی فرماسیون پرو بدون سبک خودت', 'دو CDM بدون مهاجم نوک'],
    proRef: 'Meta formations shift per patch — check live news before finals.',
  },
  {
    id: 'sp-sbc',
    realm: 'sports',
    titleFa: 'SBC و ساخت اسکواد چلنج',
    titleEn: 'SBC & Squad Building Challenges',
    keywords: ['sbc', 'squad building', 'challenge', 'challenges', 'اس‌بی‌سی', 'اس بی سی', 'چلنج', 'اسکواد بیلدینگ', 'پک', 'استار مارک'],
    lessonsFa: [
      'قانون طلایی SBC: حداقل هزینه — از کارت‌های untradeable و بازیکنان لیگ کم‌مصرف استفاده کن؛ هرگز کارت اصلی کلاب را فدیه نکن.',
      'قبل از ثبت SBC، ارزش بازگشتی پک را حساب کن: اگر کمتر از ۸۰٪ ورودی بود، نزن.',
      'SBCهای پرارزش (marquee matchups) را با کمترین ریتینگ فloor کامل کن؛ حداکثر پاداش از لیگ‌های ارزان.',
    ],
    lessonsEn: [
      'Golden SBC rule: minimum cost — use untradeables and low-demand league players; never sacrifice main club cards.',
      'Before submitting, check pack expected return: if below 80% of input, skip it.',
      'Complete high-value SBCs with the lowest rating floor; max rewards from cheap leagues.',
    ],
    drills: ['SBC Budget Planner'],
    mistakesFa: ['فرستادن کارت گران tradeable', 'نادیده گرفتن قید لیگ'],
    proRef: 'Track live SBC releases & community solutions from trading communities online.',
  },
  {
    id: 'st-opening',
    realm: 'strategy',
    titleFa: 'شروع بازی و اصول افتتاح',
    titleEn: 'Opening Principles',
    keywords: ['opening', 'book', 'develop', 'شروع', 'افتتاح', 'دبیلمنت'],
    lessonsFa: [
      'سه اصل: مرکز، دبیلمنت، امنیت شاه — ترتیب مهم است.',
      'هرگز یک مهره را دو بار در افتتاح حرکت نده مگر با دلیل تاکتیکی.',
    ],
    lessonsEn: [
      'Three principles: center, development, king safety — in that order.',
      'Never move a piece twice in the opening without a tactical reason.',
    ],
    drills: ['10s Chess Tactics Drill', 'Opening Ladder Reps'],
    mistakesFa: ['حمله‌ی زود با وزیر', 'بیرون ماندن فیل شاه'],
    proRef: 'Blitz rating climbs fastest on clean openings, not traps.',
  },
  {
    id: 'st-tactics',
    realm: 'strategy',
    titleFa: 'تاکتیک و ترکیب‌ها',
    titleEn: 'Tactical Patterns',
    keywords: ['tactic', 'fork', 'pin', 'combo', 'تاکتیک', 'ترکیب', 'چنگال'],
    lessonsFa: [
      'هر بار قبل از حرکت: چک، کپچر، تهدید را از سه زاویه اسکن کن.',
      'الگوها را حفظ کن: سنجاق، چنگال، کش‌بک، دیسکاوروید — شناخت الگو سرعت حل می‌دهد.',
    ],
    lessonsEn: [
      'Every move: scan checks, captures, threats from both sides.',
      'Memorize motifs: pin, fork, skewer, discovered attack.',
    ],
    drills: ['Chess Tactics Rush', 'Pattern Recognition Ladder'],
    mistakesFa: ['حرکت با کاهش کیفیت (blunder check نکردن)', 'نادیده گرفتن پاسخ حریف'],
    proRef: 'Pattern library beats raw calculation below master level.',
  },
  {
    id: 'st-endgame',
    realm: 'strategy',
    titleFa: 'اندگیم و فناوری پایانی',
    titleEn: 'Endgame Technique',
    keywords: ['endgame', 'king', 'pawn', 'promotion', 'اندگیم', 'پایان', 'ارزش'],
    lessonsFa: [
      'شاه فعال در اندگیم یک مهره است؛ بیاور وسط.',
      'پیاده ردیف‌شده بیشتر از حمله‌ی بی‌پشتوانه ارزش دارد؛ تبادل را هدفمند کن.',
    ],
    lessonsEn: [
      'An active king is a piece in the endgame — centralize it.',
      'A passed pawn outweighs an unsupported attack; trade with purpose.',
    ],
    drills: ['Endgame Composure Drill'],
    mistakesFa: ['شاه منفعل در اندگیم', 'تبادل بی‌برنامه'],
    proRef: 'Endgame composure converts close games — drill it daily.',
  },
  {
    id: 'st-tempo',
    realm: 'strategy',
    titleFa: 'تمپو و کنترل ریتم',
    titleEn: 'Tempo Control',
    keywords: ['tempo', 'initiative', 'rhythm', 'تمپو', 'ریتم', 'ابتکار'],
    lessonsFa: [
      'تمپو یعنی مجبور کردن حریف به واکنش؛ هر حرکت تهدید بده یا پیشروی.',
      'وقتی پیشروی، زمان را حفظ کن؛ وقتی عقب، تعادل را.',
    ],
    lessonsEn: [
      'Tempo = forcing reactions; every move threatens or advances.',
      'When ahead trade pieces, keep pawns; when behind, reverse it.',
    ],
    drills: ['Tempo Control Scrim'],
    mistakesFa: ['حرکت بی‌تهدید در برتری', 'شتاب عجولانه در برتری مادی'],
    proRef: 'Convert advantages: simplify when ahead, complicate when behind.',
  },

  /* ---------------- cross-cutting ---------------- */
  {
    id: 'x-meta',
    realm: 'cross',
    titleFa: 'متا و آپدیت‌های بازی',
    titleEn: 'Meta & Patch Awareness',
    keywords: ['meta', 'patch', 'update', 'news', 'متا', 'پچ', 'آپدیت', 'جدید'],
    lessonsFa: [
      'بعد از هر پچ: لینک تغییریافته‌ها را ببین و یک دریل با متای جدید بزن؛ عادت‌های قدیمی گران‌اند.',
      'متا را از منابع زنده (اخبار رسمی، انجمن‌ها) بخوان نه از حافظه‌ی قدیمی.',
    ],
    lessonsEn: [
      'After every patch: read the changed lineups and run one drill on the new meta.',
      'Read the meta from live sources (official news, communities), not stale memory.',
    ],
    drills: ['Meta Adaptation Scrim'],
    mistakesFa: ['اعتماد به دانش پچ قبل', 'نادیده گرفتن nerf/buff'],
    proRef: 'Coach consult mesh pulls live Reddit/Wikipedia sources on demand.',
  },
  {
    id: 'x-tilt',
    realm: 'cross',
    titleFa: 'کنترل تیلت و تمرکز',
    titleEn: 'Tilt Control & Focus',
    keywords: ['tilt', 'focus', 'mental', 'anger', 'تیلت', 'عصبانی', 'تمرکز'],
    lessonsFa: [
      'بعد از دو باخت پشت هم، یک وقت‌استراحت ۵ دقیقه‌ای؛ تیلت آمار برد را ۲۰٪ می‌کاهد.',
      'هدف هر سشن را یک مهارت بگذار، نه برد؛ پیشرفت قابل اندازه‌گیری انگیزه می‌سازد.',
    ],
    lessonsEn: [
      'Two losses in a row → 5-minute break; tilt cuts win rate ~20%.',
      'Set one skill goal per session, not a win goal.',
    ],
    drills: ['Reset Breathing Routine'],
    mistakesFa: ['چرخاندن مچ بعد از باخت', 'بازی خسته'],
    proRef: 'Pro schedules cap ranked sessions at 90 minutes.',
  },
  {
    id: 'x-setup',
    realm: 'cross',
    titleFa: 'تنظیمات و تجهیزات',
    titleEn: 'Setup & Settings',
    keywords: ['settings', 'sensitivity', 'dpi', 'setup', 'تنظیمات', 'حساسیت'],
    lessonsFa: [
      'حساسیت را ثابت نگه دار و فقط یک‌بار بهینه کن؛ تغییر مداوم حافظه‌ی عضلانی را می‌شکند.',
      'فریم‌ریت بالاتر از گرافیک قشنگ مهم‌تر است؛ اول FPS، بعد ظاهر.',
    ],
    lessonsEn: [
      'Fix sensitivity once, tune once, then never touch it mid-season.',
      'Prioritize FPS over visuals; performance beats pretty.',
    ],
    drills: ['Sensitivity Confirmation Reps'],
    mistakesFa: ['کپی کور تنظیمات پرو', 'تغییر حساسیت وسط فصل'],
    proRef: 'Pros change settings at most twice per season.',
  },
  {
    id: 'x-schedule',
    realm: 'cross',
    titleFa: 'برنامه‌ی تمرین حرفه‌ای',
    titleEn: 'Pro Training Schedule',
    keywords: ['schedule', 'routine', 'plan', 'practice', 'برنامه', 'تمرین', 'روتین'],
    lessonsFa: [
      'سشن حرفه‌ای: ۱۰ دقیقه warmup → ۴۰ دقیقه دریل هدفمند → ۲۰ دقیقه بازی رنک → ۱۰ دقیقه ریویو دمو.',
      'روزانه یک ضعف را هدف بگیر؛ هفته‌ای یک بعد DNA باید رشد کند.',
    ],
    lessonsEn: [
      'Pro session: 10 warmup → 40 targeted drills → 20 ranked → 10 demo review.',
      'Target one weakness per day; one DNA axis should grow weekly.',
    ],
    drills: ['Full Pro Session Template'],
    mistakesFa: ['فقط بازی رنک بدون دریل', 'ریویو نکردن باخت‌ها'],
    proRef: 'Structured practice improves rating 3x faster than grinding.',
  },
];

export const COACH_KNOWLEDGE_BASE = KB;

/** Score a query against the KB — returns best-matching topics in order. */
export function matchKnowledgeTopics(
  query: string,
  realmHint?: RealmId,
  limit = 3
): Array<{ topic: CoachKnowledgeTopic; score: number }> {
  const q = query.toLowerCase();
  const scored = KB.map((topic) => {
    let score = 0;
    for (const kw of topic.keywords) {
      if (q.includes(kw.toLowerCase())) score += kw.length >= 5 ? 2 : 1;
    }
    if (realmHint && topic.realm === realmHint) score += 1;
    if (realmHint && topic.realm === 'cross') score += 0.5;
    return { topic, score };
  })
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored;
}

export function topicsByRealm(realm: RealmId): CoachKnowledgeTopic[] {
  return KB.filter((t) => t.realm === realm || t.realm === 'cross');
}
