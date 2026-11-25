/**
 * AIPETROS Global Language Override Engine.
 * Some legacy components hardcode Persian UI strings. This engine guarantees
 * the user's rule: "when the language changes, ALL pages change".
 *
 * Strategy: an exact+substring Persian→English dictionary applied over the
 * live DOM (text nodes + placeholder/title/aria-label attributes), driven by
 * a debounced MutationObserver. React's own i18n (copy.*) renders English
 * already and is untouched; this layer catches hardcoded leftovers.
 * Persian (fa/prs) is the native language — no rewrite happens for it.
 */

export const FA_UI_DICTIONARY: Record<string, string> = {
  // ---- common controls ----
  'توقف پخش': 'Stop playback',
  'پخش': 'Play',
  'پخش سریع': 'Quick play',
  'توقف': 'Stop',
  'همه': 'All',
  'بازگشت': 'Back',
  'بازگشت به لابی': 'Back to lobby',
  'بازگشت به لابی سینما': 'Back to cinema lobby',
  'بازگشت به لابی موزیک': 'Back to music lobby',
  'بازگشت به منوی اصلی': 'Back to main menu',
  'بستن': 'Close',
  'بستن فرم': 'Close form',
  'بستن پنجره پست جدید': 'Close new post window',
  'بستن پنل استریم': 'Close stream panel',
  'بستن پنل موزیک و فصل‌ها': 'Close music & chapters panel',
  'بستن لیست کلیپ‌ها': 'Close clips list',
  'بستن لیست ۵۰ شخصیت': 'Close 50-characters list',
  'بستن انتخاب بازی': 'Close game picker',
  'بستن اطلاعات پچ': 'Close patch info',
  'بستن شناسنامه': 'Close identity card',
  'بستن جدول کامل': 'Close full standings',
  'بستن فرم ساخت کلاب': 'Close club creation form',
  'بستن منوی کنترل سنتر': 'Close control center menu',
  'بستن منوی موزیک': 'Close music menu',
  'بستن پروفایل بازیکن': 'Close player profile',
  'بستن فید کلوپ طرفداران': 'Close fan club feed',
  'بستن پنجره‌های سیستم': 'Close system windows',
  'بستن پنجره': 'Close window',
  'ادد': 'Add',
  'ارسال نظر': 'Send comment',
  '+ ارسال استریم': '+ Add stream',
  'بروزرسانی': 'Refresh',
  'همگام‌سازی...': 'Syncing…',
  'در حال آنالیز...': 'Analyzing…',
  'در حال بروزرسانی...': 'Updating…',
  'در حال تحلیل صحنه...': 'Analyzing your scene…',
  'در حال بررسی صحنه شما...': 'Reviewing your scene…',
  'در حال باز کردن سیستم...': 'Opening the system…',
  'هم‌اکنون': 'Just now',
  'آنلاین': 'Online',
  'در حال پخش': 'Now playing',
  'حالت سینما': 'Cinema mode',
  'نور عادی محیط': 'Ambient light',
  'وصل صدا': 'Unmute',
  'بی‌صدا': 'Muted',
  'بی‌صدا کردن موسیقی': 'Mute soundtrack',
  'بی‌صدا کردن کاراکتر': 'Mute character voice',
  'فعال‌سازی صدای کاراکتر': 'Enable character voice',
  'حجم صدا': 'Volume',
  'صدا': 'Audio',
  'ترک قبلی': 'Previous track',
  'ترک بعدی': 'Next track',
  'زمان پخش موزیک یا پادکست': 'Music/podcast playback time',
  'صحنه قبلی': 'Previous scene',
  'صحنه بعدی': 'Next scene',
  'نوار زمان پخش': 'Playback timeline',
  'شروع پخش': 'Start playback',
  'شروع پخش استریم': 'Start streaming',
  'پخش فضای سه‌بعدی': 'Play 3D space',
  'پخش موسیقی متن مکس پین': 'Play Max Payne soundtrack',
  'توقف موسیقی متن مکس پین': 'Stop Max Payne soundtrack',
  'پخش فریم': 'Play frame',
  'توقف فریم': 'Pause frame',
  'اسکرابر فریم تحلیل': 'Analysis frame scrubber',
  'کشیدن دوباره خط و دایره': 'Redraw line & circle',
  '۴ ایجنت داخلی در حال استخراج دیتای زنده وب...': '4 internal agents extracting live web data…',
  'روی هر جای عکس کلیک کن تا VisionAgent از همان‌جا خط و دایره بکشد': 'Click anywhere on the image — VisionAgent will draw the line & circle from there',
  'بروزرسانی زنده ایجنت‌های داخلی AIPETROS': 'Live refresh — AIPETROS internal agents',
  '۴ سبک مربی': '4 coach styles',
  'راهنمای تاکتیکی ۳ مرحله‌ای': '3-step tactical guide',
  'توقف صدای مربی': 'Stop coach voice',
  'پخش راهنمای صوتی مربی': 'Play coach voice guide',
  'پرسش صوتی از مربی': 'Ask the coach by voice',
  'سوال صوتی از مربی': 'Ask the coach by voice',
  'ارسال صحنه جدید': 'Send new scene',
  'ارسال کلیپ یا عکس من': 'Send my clip or image',
  'مشاهده در یوتیوب': 'Watch on YouTube',
  'پخش کلیپ حرفه‌ای': 'Play pro clip',
  'مشاهده و جستجو': 'View & search',
  'توقف ضبط صدا': 'Stop recording',
  'ضبط صوت در این مرورگر پشتیبانی نمی‌شود؛ می‌توانید پیام خود را تایپ کنید.': 'Voice recording is not supported in this browser; you can type your message.',

  // ---- social / GTA ----
  'چت': 'Chat',
  'چت و دایرکت': 'Chat & DM',
  'چت و دایرکت خصوصی': 'Chat & private DM',
  'چت عمومی': 'Public chat',
  'چت خصوصی': 'Private chat',
  'چت کلاب': 'Club chat',
  'چت گروهی کلاب': 'Club group chat',
  'چت عمومی رادیو وایس‌سیتی': 'Vice City Radio public chat',
  'چت زنده وایس‌سیتی': 'Vice City live chat',
  'چت زنده کلاب سینما و دایرکت': 'Cinema club live chat & DM',
  'چت زنده کلاب موزیک و دایرکت': 'Music club live chat & DM',
  'چت رمزنگاری‌شده': 'Encrypted chat',
  'چت عادی': 'Standard chat',
  'دوستان': 'Friends',
  'دوستان من': 'My friends',
  'دوستان و ادد': 'Friends & adds',
  'دوست شما': 'Your friend',
  'افزودن دوست': 'Add friend',
  'حذف دوستی': 'Remove friend',
  'ادد کردن': 'Add friend',
  'عضو هستید': 'You are a member',
  'کلاب‌ها': 'Clubs',
  'کلاب': 'Club',
  'هایست': 'Heist',
  'اوشن': 'Ocean',
  'دریفت': 'Drift',
  'وایس': 'Vice',
  'مارینا': 'Marina',
  'کلاب و هایست': 'Clubs & heists',
  'اوشن درایو': 'Ocean Drive',
  'فید و پست‌ها': 'Feed & posts',
  'همه پست‌ها': 'All posts',
  'پست‌ها و فیلم‌ها': 'Posts & films',
  'پست جدید': 'New post',
  'ذخیره پست': 'Save post',
  'جستجوی آیدی یا نام بازیکن...': 'Search by ID or player name…',
  'جستجوی نام، آیدی، اتاق یا کلاب [TAG]...': 'Search name, ID, room or club [TAG]…',
  'جستجو با آیدی (@handle)، نام گیمر، تگ کلاب یا بازی...': 'Search by @handle, gamer name, club tag or game…',
  'فیلتر لیست دوستان': 'Filter friends list',
  'جستجوی نام یا فیلم محبوب...': 'Search a name or favorite film…',
  'همه افراد': 'Everyone',
  'ارسال پیام انجام نشد.': 'Message could not be sent.',
  'اطلاعات پست را بررسی کنید.': 'Please check the post details.',
  'خطا در ارسال پیام کلاب': 'Club message failed',
  'خطا در ثبت پست': 'Failed to publish post',
  'خطا در ثبت نوشته': 'Failed to save the note',
  'متن پست را بنویسید (حداقل ۳ کاراکتر).': 'Write the post text (min 3 characters).',
  'پیام خود را بنویسید...': 'Write your message…',
  'پیام خود را در چت وایس‌سیتی بنویسید...': 'Write your message in the Vice City chat…',
  'پیام خصوصی یا لینک فیلم را بنویسید...': 'Write a private message or film link…',
  'پیام خود را در کلاب بنویسید...': 'Write your message in the club…',
  'کامنت خود را بنویسید...': 'Write your comment…',
  'نظر خود را بنویسید (اسپویل خودکار تار می‌شود)...': 'Write your comment (spoilers are auto-blurred)…',
  'نظر خود را درباره این فیلم بنویسید...': 'Write your review of this film…',
  'اسم فیلم یا ویدیو (مثلاً Heat 4K)': 'Film or video title (e.g. Heat 4K)',
  'مثلاً Heat (1995) 4K': 'e.g. Heat (1995) 4K',
  'https://...m3u8 یا .mp4 یا لینک تلگرام': 'https://…m3u8, .mp4 or Telegram link',
  'https://...m3u8 یا .mp4 یا تلگرام': 'https://…m3u8, .mp4 or Telegram',
  'https://...mp3 یا .m3u8 یا لینک تلگرام': 'https://…mp3, .m3u8 or Telegram link',
  'https://...mp3 یا .m3u8 یا تلگرام': 'https://…mp3, .m3u8 or Telegram',
  'https://...mp3 یا .m3u8': 'https://…mp3 or .m3u8',
  'لینک مستقیم فیلم': 'Direct film link',
  'فیلم ارسال‌شده در چت': 'Film shared in chat',
  'لینک فیلم کپی و در چت عمومی منتشر شد.': 'Film link copied and published in public chat.',
  'حداقل ۴ کاراکتر یا عدد وارد کنید یا ورود سریع را بزنید.': 'Enter at least 4 characters/digits or press Quick sign-in.',
  'دایرکت خصوصی': 'Private DM',
  'پیام خصوصی امن': 'Secure private message',
  'فیلم و مستند': 'Films & documentaries',
  'سریال و انیمه': 'Series & anime',
  'فیلم و سریال': 'Films & series',
  'جستجو در فیلم‌ها یا متن پست‌ها...': 'Search films or post text…',
  'پست به چت عمومی ارسال شد.': 'Post sent to public chat.',
  'نام کلاب (مثلاً کلاب فیلم‌های نولان)': 'Club name (e.g. Nolan Films Club)',
  'نام کلاب باید حداقل ۳ کاراکتر باشد.': 'Club name must be at least 3 characters.',
  'تگ کلاب باید بین ۲ تا ۴ حرف انگلیسی (مثلاً VICE) باشد.': 'Club tag must be 2–4 Latin letters (e.g. VICE).',
  'تگ (NOLAN)': 'Tag (NOLAN)',
  'توضیح کوتاه کلاب...': 'Short club description…',
  'عضویت در کلاب': 'Join club',
  'فیلم کلاب': 'Club film',
  'نام فیلم...': 'Film title…',
  'گفتگوی زنده با دوستان و ارسال مستقیم فیلم': 'Live chat with friends & direct film sharing',
  'ارسال پست، ویدیو یا لینک فیلم': 'Share a post, video or film link',
  'انتشار در فید سینمایی برای همه اعضا': 'Publish to the cinema feed for all members',
  'چرا این فیلم یا سکانس جذابه؟...': 'Why is this film or scene great?…',
  'مقر کلاب‌های وایس‌سیتی در پنت‌هاوس استارفیش': 'Vice City clubs HQ — Starfish Penthouse',
  'مثلاً Vice Midnight Riders': 'e.g. Vice Midnight Riders',
  'قوانین و سبک کلاب خود را بنویسید...': 'Write your club rules & style…',
  'دیوار کلاب باز است': 'Club wall is open',
  'مشاهده دیوار کلاب': 'View club wall',
  'اطلاعیه یا پیام جدید روی دیوار کلاب بنویسید...': 'Write a new announcement on the club wall…',
  'پیام جدید روی دیوار کلاب': 'New club-wall message',
  'لینک پست کپی شد و شمارنده اشتراک‌گذاری به‌روزرسانی شد': 'Post link copied — share counter updated',
  'لینک پست کپی و به اشتراک گذاشته شد': 'Post link copied & shared',
  'پست در چت عمومی رادیو وایس‌سیتی به اشتراک گذاشته شد': 'Post shared in Vice City Radio public chat',
  'پست در چت عمومی کلاب منتشر شد': 'Post published in the club public chat',
  'فیلتر فید سوشال مدیا': 'Media social feed filter',
  'سوشال مدیا GTA': 'GTA media social',
  'بخش‌های سوشال کلاب GTA VI': 'GTA VI social club sections',
  'بخش‌های سوشال کلاب': 'Social club sections',
  'منوی موبایل سوشال کلاب': 'Mobile social club menu',
  'ارتباط زنده اعضای کلاب‌ها، اشتراک پست و هماهنگی میتینگ شبانه': 'Live member comms, post sharing & night-meeting coordination',
  'از میتینگ امشب، رکورد جدید یا کلاب خودتان بنویسید...': 'Write about tonight’s meeting, a new record or your club…',
  'آماده‌ام، لابی رو بسازید': 'Ready — build the lobby',
  'بزن بریم میتینگ اوشن درایو': 'Let’s hit the Ocean Drive meeting',
  'پایه هایست امشبم با کلاب': 'Heist crew tonight with the club',
  'بازگشت به تالار صدا': 'Back to the audio hall',
  'برندگان': 'Winners',
  'قهرمان فصل': 'Season champion',
  'سوشال کلاب سینما و تلویزیون': 'Cinema & TV social club',
  'سوشال کلاب موزیک و پادکست': 'Music & podcast social club',
  'فید فیلم و سریال · واچ‌پارتی · کلاب آرشیو · چت زنده': 'Film & series feed · watch party · archive club · live chat',
  'فید ترک و پادکست · پلی‌لیست کلاب‌ها · چت زنده': 'Track & podcast feed · club playlists · live chat',
  'فیلم، سریال یا استریم تلگرام خودت را به اشتراک بگذار': 'Share your film, series or Telegram stream',
  'ترک، میکس، پادکست یا فصل کتاب صوتیت را به اشتراک بگذار': 'Share your track, mix, podcast or audiobook chapter',
  'موزیک و ریو': 'Music & rave',
  'انیمه، مستند و رترو': 'Anime, docs & retro',
  'کتاب صوتی و پادکست': 'Audiobook & podcast',
  'دوستان و آرشیویست‌های کلاب سینما': 'Friends & archivists of the cinema club',
  'دوستان، دی‌جی‌ها و شنوندگان کلاب موزیک': 'Friends, DJs & listeners of the music club',
  'آرشیویست کلاب سینما و تلویزیون': 'Cinema & TV club archivist',
  'کیوریتور کلاب موزیک و پادکست': 'Music & podcast club curator',
  'انتشار پست جدید در کلاب سینما': 'Publish new post in the cinema club',
  'انتشار پست جدید در کلاب موزیک و پادکست': 'Publish new post in the music & podcast club',
  'نقد فیلم، پیشنهاد سریال یا اطلاع‌رسانی واچ‌پارتی امشب را بنویسید...': 'Write a film review, series tip or tonight’s watch party…',
  'ترک محبوب، ست ریو امشب یا نکته کتاب صوتی خود را بنویسید...': 'Write your favorite track, tonight’s rave set or an audiobook note…',
  'کلاب سینمای ۴K': '4K Cinema Club',
  'پنت‌هاوس کلاب': 'Club penthouse',
  'غروب بلوار وایس‌سیتی': 'Vice City boulevard sunset',
  'مارینای لئونیدا': 'Leonida marina',
  'دریافت دعوت': 'Get invited',
  'پنت‌هاوس استارفیش': 'Starfish penthouse',

  // ---- cinema ----
  'فیلم سینمایی': 'Feature Film',
  'سریال': 'Series',
  'انیمه': 'Anime',
  'مستند': 'Documentary',
  'تلویزیون و کلایمکس': 'TV & Climax',
  'فید پست‌ها و فیلم‌ها': 'Posts & films feed',
  'پست‌های سینمایی، لایک، کامنت و پخش مستقیم': 'Cinema posts, likes, comments & direct playback',
  'گفتگو، ارسال مستقیم فیلم و لینک استریم': 'Chat, direct film sharing & stream links',
  'دوستان و کاربران سینما': 'Cinema friends & users',
  'جستجو، افزودن دوست و پروفایل‌ها': 'Search, add friends & profiles',
  'کلاب‌ها و گروه‌های فیلم': 'Film clubs & groups',
  'عضویت در کلاب و اشتراک فیلم داخل گروه': 'Join clubs & share films in the group',
  'همه اعضای آنلاین · گفتگو و اشتراک لینک فیلم': 'All online members · chat & film links',
  'ورود به شبکه سینمایی CINE-OS': 'Sign in to the CINE-OS network',
  'ورود به شبکه اجتماعی سینما (CINE-OS)': 'Sign in to the cinema social network (CINE-OS)',
  'سیستم اختصاصی چت، ارسال فیلم و کلاب‌ها': 'Dedicated chat, film sharing & clubs system',
  'کد تایید شد — در حال باز کردن پنجره‌های چت، پست‌ها و کلاب‌های سینما...': 'Code verified — opening cinema chats, posts & clubs…',
  'پس‌زمینه سیستم CINE-OS': 'CINE-OS system backdrop',
  'پنجره‌های سیستم': 'System windows',
  'قفل کردن صفحه رمز سیستم': 'Lock the system code screen',
  'گفتگوی گروهی، کلاب‌ها و ارسال مستقیم فیلم در دایرکت': 'Group chats, clubs & direct film sharing in DMs',
  'انتخاب سالن سه‌بعدی سینما و تلویزیون': 'Pick a cinema & TV 3D hall',
  'اطلاعات سالن سینمای فعال': 'Active cinema hall info',
  'اعضای واچ‌پارتی سالن': 'Hall watch-party members',
  'سالن تکمیل شد': 'Hall is full',
  'برای دعوت روی صندلی خالی بزنید': 'Click an empty seat to invite',
  'مشخصات پخش سالن': 'Hall playback specs',
  'سالن نوآر کلاسیک': 'Classic Noir Hall',
  'بازگشت به سالن سینما': 'Back to the cinema hall',
  'لینک اکانت‌های سینما، تلگرام و سوشیال': 'Link cinema, Telegram & social accounts',
  'کارت پروفایل تخصصی سینما و تلویزیون': 'Cinema & TV specialty profile card',
  'آرشیویست نوآر': 'Noir Archivist',
  'نگاه کارگردان': 'Director’s Eye',

  // ---- music / audio ----
  'کافه وست‌ورلد': 'Westworld Café',
  'صحنه کنسرت': 'Concert scene',
  'برلین الکترونیک': 'Berlin Electronic',
  'فستیوال': 'Festival',
  'خلوت و مدیتیشن': 'Zen & Meditation',
  'کتابخانهٔ قدیمی': 'Ancient Library',
  'استودیوی پادکست': 'Podcast Studio',
  'کافه وستورلد': 'Westworld Café',
  'تالارِ گفت‌وگوی همگانی': 'Common conversation hall',
  'نامه‌ها، شعرها و قطعات صوتی مشترک': 'Letters, poems & shared audio pieces',
  'محفلِ کلاب': 'Club circle',
  'گفت‌وگوی محفل': 'Circle conversation',
  'نامهٔ خصوصی': 'Private letter',
  'دفتر خصوصی': 'Private ledger',
  'دفترِ گفت‌وگو': 'Conversation ledger',
  'ارسال متن، شعر و قطعهٔ صوتی': 'Send text, poetry & audio pieces',
  'برگه کپی و در تالار همگانی نقل شد.': 'Sheet copied & quoted in the common hall.',
  'در تالار همگانی نقل شد.': 'Quoted in the common hall.',
  'قطعهٔ صوتی / پادکست': 'Audio piece / podcast',
  'ارسال نامه انجام نشد.': 'The letter could not be sent.',
  'لطفاً متن برگه را بنویسید.': 'Please write the sheet text.',
  'دیوان': 'The Divan',
  'فصل اول': 'Chapter 1',
  'فصل دوم': 'Chapter 2',
  'فصل سوم': 'Chapter 3',
  'فصل چهارم': 'Chapter 4',
  'فصل‌های کتاب': 'Book chapters',
  'صفحات و اشعار': 'Sheets & poems',
  'نامه‌ها و گفت‌وگو': 'Letters & conversations',
  'هم‌صحبتان': 'Interlocutors',
  'محفل‌ها و کلاب': 'Circles & clubs',
  'نامهٔ محرمانه': 'Confidential letter',
  'یادداشت باز': 'Open note',
  'نغمهٔ پیوستی': 'Attached melody',
  'عنوان قطعه یا کتاب صوتی...': 'Audio piece or audiobook title…',
  'نامهٔ خصوصی، بیت شعر یا نظر خود را بنویسید...': 'Write a private letter, a verse or your thoughts…',
  'در تالار بنویسید...': 'Write in the hall…',
  'میز کتابخانه و دفتر شعر': 'Library desk & poetry ledger',
  'فصل‌بندی و بوکمارک هوشمند کتاب صوتی و پادکست': 'Smart audiobook & podcast chaptering and bookmarks',
  'بوکمارک زمانی لحظه‌های موزیک (Chapterizer Engine)': 'Time-stamped music moment bookmarks (Chapterizer Engine)',
  'انتخاب فضای موزیک و پادکست': 'Pick a music & podcast space',
  'اطلاعات فضای صوتی فعال': 'Active audio space info',
  'حلقه شنوندگان اتاق': 'Room listener ring',
  'حلقه تکمیل شد': 'Ring is full',
  'مشخصات آکوستیک اتاق': 'Room acoustics specs',
  'فهرست فصل‌ها و بوکمارک': 'Chapters & bookmarks list',
  'بوکمارک زمانی لحظه‌ها': 'Time-stamped moment bookmarks',
  'نشانک صفحه': 'Page bookmark',
  'نقل و ارسال خصوصی': 'Quote & private share',
  'نقل خصوصی': 'Private quote',
  'حاشیه': 'Margin note',
  'حاشیه ۰': 'Margin notes 0',
  'حاشیه یا نظر خود را بر این صفحه بنویسید...': 'Write a margin note or comment on this sheet…',
  'همهٔ برگه‌ها': 'All sheets',
  'همهٔ نویسندگان': 'All authors',
  'در حال مطالعه / آنلاین': 'Reading / online',
  'جستجو در سطرها، شعرها یا نام نویسنده...': 'Search lines, poems or author name…',
  'جستجوی نام یا جملهٔ فلسفی...': 'Search a name or philosophical line…',
  'نام محفل یا کلاب...': 'Circle or club name…',
  'نشان (مثلاً حافظ)': 'Tag (e.g. Hafez)',
  'توضیح و مرام‌نامهٔ محفل...': 'Circle description & manifesto…',
  'پیوستن به محفل': 'Join the circle',
  'عنوان قطعهٔ صوتی...': 'Audio piece title…',
  'مثلاً در ستایشِ سکوتِ شب...': 'e.g. In Praise of the Night’s Silence…',
  'جمله‌ای کوتاه برای سرلوحهٔ صفحه...': 'A short line for the page header…',
  'تأملات، شعر یا حس‌وحال این موسیقی و کتاب صوتی را بنویسید...': 'Write reflections, poetry or the mood of this music & audiobook…',
  'مثلاً Nocturne in C Minor': 'e.g. Nocturne in C Minor',
  'نکته کلیدی: رمزگشایی طومار داوینچی در فصل دوم': 'Key note: decoding the Da Vinci scroll in chapter 2',
  'نغمهٔ محفل': 'Circle melody',
  'لینک اکانت‌های موزیک، پادکست و سوشیال': 'Link music, podcast & social accounts',
  'کارت پروفایل تخصصی موزیک و پادکست': 'Music & podcast specialty profile card',
  'گوش تیز آکوستیک': 'Keen Acoustic Ear',
  'ریتم‌محور': 'Rhythm-Driven',
  'کیانوش راد': 'Kianoush Rad',
  'انتخاب اتاق سینما': 'Pick a cinema room',
  'انتخاب اتاق موزیک و پادکست': 'Pick a music & podcast room',

  // ---- account settings ----
  'تنظیمات حساب کاربری، ایمیل، رمز عبور و خروج': 'Account settings, email, password & sign-out',
  'حساب و ایمیل': 'Account & email',
  'رمز عبور و امنیت': 'Password & security',
  'حریم خصوصی و اعلان‌ها': 'Privacy & notifications',
  'نشست‌ها و خروج': 'Sessions & sign-out',
  'مشخصات حساب کاربری با موفقیت ذخیره شد.': 'Account details saved successfully.',
  'آدرس ایمیل معتبر نیست.': 'The email address is invalid.',
  'لطفاً فیلدهای رمز عبور را بررسی کنید.': 'Please check the password fields.',
  'رمز عبور جدید با موفقیت ثبت شد و تمام کلیدهای امنیتی به‌روزرسانی شدند.': 'New password saved — all security keys were rotated.',
  'ایمیل بازیابی معتبر نیست.': 'The recovery email is invalid.',
  'ایمیل بازیابی حساب ذخیره شد.': 'Recovery email saved for the account.',
  'ایمیل نامعتبر است.': 'Invalid email.',
  'لطفاً رمز عبور خود را وارد کنید.': 'Please enter your password.',
  'نمایش پنل تنظیمات': 'Show settings panel',
  'نمایش کامل سکانس برفی': 'Show the full snow scene',
  'نمایش تنظیمات': 'Show settings',
  'نمای کامل سکانس': 'Full scene view',
  'بخش‌های تنظیمات حساب کاربری': 'Account settings sections',
  'تایید شده': 'Verified',
  'در انتظار تایید': 'Pending verification',
  'مخفی کردن رمز فعلی': 'Hide current password',
  'نمایش رمز فعلی': 'Show current password',
  'حداقل ۸ کاراکتر': 'At least 8 characters',
  'مخفی کردن رمز جدید': 'Hide new password',
  'نمایش رمز جدید': 'Show new password',
  'تکرار دقیق رمز جدید': 'Repeat the new password exactly',
  'مخفی کردن تکرار رمز': 'Hide password repeat',
  'نمایش تکرار رمز': 'Show password repeat',
  'هشدار امنیتی ورودهای جدید': 'New sign-in security alerts',
  'ارسال ایمیل فوری هنگام ورود به حساب از مرورگر یا دستگاه ناشناس.': 'Email me instantly on sign-in from an unknown browser or device.',
  'نمایش وضعیت آنلاین در لابی و کلاب': 'Show online status in lobbies & clubs',
  'دوستان و اعضای کلاب می‌توانند آنلاین بودن شما را در بازی‌ها ببینند.': 'Friends & club members can see when you are online in games.',
  'اعلان تورنمنت‌ها و دعوت‌نامه‌های مسابقه': 'Tournament & match-invite notifications',
  'اطلاع‌رسانی شروع رقابت‌ها و پیام‌های مربی هوشمند.': 'Get notified when competitions start & for smart-coach messages.',
  'همگام‌سازی خودکار پروفایل در ۱۱ بازی': 'Auto-sync profile across 11 games',
  'ذخیره خودکار تغییرات هویت و لینک‌های سوشال در تمام فضاهای بازی.': 'Auto-save identity & social-link changes in every game space.',
  'لینک اکانت‌های سوشیال و گیم': 'Link social & game accounts',
  'لینک کردن شبکه‌های اجتماعی و اکانت‌های بازی': 'Connect social networks & game accounts',
  'اتصال': 'Connect',
  'حذف اتصال': 'Disconnect',
  'اتصال همزمان IMDb · Twitch · کانال تلگرام': 'Connect IMDb · Twitch · Telegram at once',
  'اتصال همزمان Spotify · SoundCloud · کانال تلگرام': 'Connect Spotify · SoundCloud · Telegram at once',
  'عنوان فیلم/اپیزود (مثلاً: سکانس باران بلید رانر)': 'Film/episode title (e.g. Blade Runner rain scene)',
  'عنوان ترک/پادکست (مثلاً: ست زنده تکنو برلین)': 'Track/podcast title (e.g. Berlin techno live set)',
  'توضیح کوتاه (هشدار: ایجنت Spoiler-Shield جملات اسپویل را تار می‌کند)': 'Short description (Spoiler-Shield blurs spoiler sentences)',
  'آدرس استریم نامعتبر است.': 'The stream URL is invalid.',
  'لینک‌های سوشیال ذخیره شدند (هندل تلگرام حداقل ۳ کاراکتر).': 'Social links saved (Telegram handle needs ≥ 3 characters).',

  // ---- identity ----
  'پسر / مرد': 'Boy / Man',
  'دختر / زن': 'Girl / Woman',
  'همه سنین': 'All ages',
  'زن': 'Woman',
  'مرد': 'Man',
  'کاراکتر زن': 'Female character',
  'کاراکتر مرد': 'Male character',
  'من سارا هستم، ۱۴ سالمه و عاشق انیمه و توکیو بارانی‌ام': 'I’m Sara, 14, obsessed with anime and rainy Tokyo',
  'مرد ۶۸ ساله علاقه‌مند به فیلم نوآر کلاسیک و مستند هستم': 'A 68-year-old into classic noir films and documentaries',
  'من دختر ۲۰ ساله عاشق تومارلند و موزیک الکترونیک‌ام': 'A 20-year-old girl in love with Tomorrowland and electronic music',
  'مرد ۷۸ ساله اهل کافه وست‌ورلد و کتاب صوتی هستم': 'A 78-year-old Westworld Café & audiobook person',
  'من سارا هستم، ۲۲ سالمه و عاشق ماجراجویی و شطرنج سریع‌ام': 'I’m Sara, 22, into adventure and blitz chess',
  'پسرم ۳۴ سالمه، اهل کانتر و بازی تاکتیکی‌ام': 'I’m a 34-year-old guy, into Counter-Strike and tactical play',
  'از خودت بگو... (اسم، سن ۸ تا ۹۹، زن/مرد و فیلم یا سریال موردعلاقه‌ات)': 'Introduce yourself… (name, age 8–99, woman/man and favorite film or series)',
  'از خودت بگو... (اسم، سن ۸ تا ۹۹، زن/مرد و سبک موزیک یا کتاب صوتی موردعلاقه‌ات)': 'Introduce yourself… (name, age 8–99, woman/man and favorite music style or audiobook)',
  'از خودت بگو... (اسم، سن، روحیه یا بازی موردعلاقه‌ات تا کاراکترت زنده ساخته بشه)': 'Introduce yourself… (name, age, vibe or favorite game so your character comes alive)',
  'نمای کامل': 'Full view',
  'کلوزآپ چهره': 'Face close-up',
  'نمای ۳ بعدی': '3D view',
  'سکانس پشت‌بام برفی مکس پین با تابلوی نئون هتل و ماشین پلیس در شب نیویورک': 'Max Payne snowy rooftop scene with hotel neon sign and a police car in a New York night',
  'ذهن تاکتیکی و دقیق': 'Sharp tactical mind',
  'انتخاب فضای بازی از ۱۱ بازی ثبت‌شده': 'Pick a game space from 11 registered games',
  'جستجو در ۵۰ شخصیت (مثلاً Arthur Morgan، Max Payne، لارا، گرالت...)': 'Search 50 characters (e.g. Arthur Morgan, Max Payne, Lara, Geralt…)',
  'نمایش اسپویل': 'Show spoiler',
  'مخفی کن': 'Hide',

  // ---- tournament ----
  'انتخاب بازی تورنمنت': 'Pick a tournament game',
  'اطلاعات تورنمنت فعال': 'Active tournament info',
  'ترکیب تیم شما': 'Your lineup',
  'ترکیب تکمیل شد': 'Lineup complete',
  'آمار کلیدی تورنمنت': 'Tournament key stats',
  'برای دعوت روی جایگاه خالی بزنید': 'Click an empty slot to invite',
  'بلوار اوشن درایو · وایس‌سیتی': 'Ocean Drive Boulevard · Vice City',
  'ورود به رختکن مسابقه': 'Enter the match locker room',
  'رتبه فعلی': 'Current rank',
  'امتیاز کل': 'Total points',
  'تفاضل گل': 'Goal difference',
  'حاضر در رختکن • آماده سوت آغاز': 'In the locker room • ready for kick-off',
  'برنده مسابقه': 'Match winner',
  'MVP راند': 'Round MVP',
  'کل راندها': 'Total rounds',
  'موجودی REP شما برای این پیشبینی کافی نیست.': 'Your REP balance is not enough for this prediction.',
  'بازارهای پیشبینی مسابقه زنده': 'Live match prediction markets',

  // ---- map / store ----
  '۵۰۰ متر': '500 m',
  '۱ کیلومتر': '1 km',
  '۲ کیلومتر': '2 km',
  'کل محدوده': 'Whole area',
  'اطلاعات نامعتبر است': 'Invalid information',
  'نام محصول (مثلاً هدفون استودیویی...)': 'Product name (e.g. studio headphones…)',
  'قیمت (دلار، مثلاً 120)': 'Price (USD, e.g. 120)',
  'نام فروشنده / آیدی شما': 'Seller name / your ID',
  'توضیحات کامل محصول، مشخصات فنی و وضعیت تحویل...': 'Full product description, specs & delivery status…',
  'هر قیمتی': 'Any price',
  'پیشنهادی': 'Recommended',
  'ارزان‌ترین': 'Cheapest',
  'گران‌ترین': 'Most expensive',
  'جدیدترین آگهی': 'Newest listing',
  'آگهی متنی کاربر': 'User text listing',

  // ---- misc social ----
  'ورود به کلوپ طرفداران': 'Enter the fan club',
  'پیام حمایت در کلوپ طرفداران...': 'Support message in the fan club…',
  'آنلاینها': 'Online',
  'پرامتیازترین': 'Top rated',
  'پاک کردن جستجو': 'Clear search',
  'وضعیت متای پچ جدید': 'New patch meta status',
  'همه بازی‌ها': 'All games',
  'اطلاعات پچ و متای بازی': 'Game patch & meta info',
  'مشکل بازیتو بنویس (مثلاً دفاع، اسموک میراژ)...': 'Describe your game problem (e.g. defense, Mirage smoke)…',
  'جستجوی هر بازی کامپیوتری (FC 27, CS2, Valorant, GTA, Elden Ring)...': 'Search any PC game (FC 27, CS2, Valorant, GTA, Elden Ring)…',
  'نمای سه‌بعدی تعاملی استادیوم FC 27 — برای چرخش افقی بکشید': 'Interactive 3D FC 27 stadium — drag to rotate horizontally',
  'روشن کردن صدای محیط استادیوم': 'Enable stadium ambience',
  'قطع صدای محیط استادیوم': 'Mute stadium ambience',
  'نام هر بازی PC را بنویسید (مثل Tekken, Forza, Hades, Rust...)': 'Name any PC game (e.g. Tekken, Forza, Hades, Rust…)',
  'توضیح صوتی': 'Audio commentary',
  'ردیت': 'Reddit',
  'یوتیوب پرو': 'YouTube Pro',
  'جستجوی کلیپ و راهنمای مربی': 'Clip & coach guide search',
  'اسم بازی یا مشکل گیم‌پلی را بنویس تا کلیپ واقعی پیدا کنیم...': 'Type a game or gameplay problem so we find a real clip…',
  'صحبت صوتی با مربی (R3)': 'Voice-talk with the coach (R3)',
  'صحبت صوتی با کاراکتر': 'Voice-talk with the character',
  // ---- dynamic bot-reply fragments + leftovers ----
  'پیام': 'messages',
  'وایس‌سیتی': 'Vice City',
  'رادیو عمومی وایس‌سیتی': 'Vice City public radio',
  'ایول': 'Nice one',
  'پیامتو توی رادیو کلاب گرفتم': 'got your message in the club radio',
  'من توی لابی': 'I’m in the',
  'آنلاينم، بزن بریم توی اسکواد!': 'lobby — online, let’s squad up!',
  'من ۱۰۰٪ پایه‌ام!': 'I’m 100% in!',
  'دیسکورد و میکروفونم روشنه': 'Discord and mic are on',
  'دعوت اسکواد رو بفرست بریم داخل مچ.': 'send the squad invite, let’s jump into the match.',
  'قلمرو': 'Territory',
  'دست کلاب ماست!': 'belongs to our club!',
  'الان ۲۰۰ امتیاز هایپ دیگه اضافه کردم تا حریف جرات نکنه نزدیک بشه.': 'just added 200 more hype points so the rival won’t dare close in.',
  'امشب ساعت': 'tonight at',
  'تورنمنت': 'tournament',
  'بچه ها': 'guys',
  'هایست امشبم با کلاب': 'heist tonight with the club',
  'پیام تو': 'your message',
  'کتاب و فلسفه': 'Books & philosophy',
  'موسیقی و کافه': 'Music & café',
  'چت عمومی سینما': 'Cinema public chat',
  'ارسال متن، عکس و لینک مستقیم فیلم': 'Send text, images & direct film links',
  'باز کردن سیستم و ورود': 'Open system & sign in',
  '۸–۱۷': '8–17',
  '۱۸–۳۵': '18–35',
  '۳۶–۵۸': '36–58',
  '۵۹–۹۹': '59–99',
  'ترفندها': 'Pro tips',
  'اجرای زنده ۴ ایجنت ADK روی صحنه بازی': 'Live run of 4 internal agents on the game scene',
  'دریفت اوشن درایو': 'Ocean Drive drift',
  'بلوار اوشن درایو · غروب وایس‌سیتی': 'Ocean Drive boulevard · Vice City sunset',
  'ارسال پیام در چت وایس‌سیتی': 'Send message in Vice City chat',
  'پس‌زمینه کلاب سینما': 'Cinema club backdrop',
  'پس‌زمینه کلاب موزیک': 'Music club backdrop',
  // seed post captions (content)
  'گل قیچی برگردان دقیقه ۹۰ با تایمینگ سبز در دربی وایس‌سیتی! 🔥⚽': 'Bicycle-kick goal in the 90th with green timing in the Vice City derby! 🔥⚽',
  'ایس ۵ نفره با AWP در Mid Window میراژ! 🔥': '5-man AWP ace at Mirage Mid Window! 🔥',
  'غروب وایس‌سیتی روی بلوار ساحلی آماده هایست امشب!': 'Vice City sunset on the beach boulevard — heist ready tonight!',
  'کی پایه واچ‌پارتی ۴K امشب تو سالن نوآره؟': 'Who’s in tonight’s 4K watch party at the Noir Hall?',
  'لینک زیرنویس انیمه توکیو آماده پخشه!': 'Tokyo anime subtitle link is ready to play!',
  'کلاب فیلم‌های کالت فعال شد — عضو شید.': 'The cult-films club is live — join in.',
  'بیس ۱۴۲ BPM برلین روشنه، کی آنلاینه؟': 'Berlin’s 142 BPM bass is up — who’s online?',
  'امشب کافه وست‌ورلد جاز آکوستیک داریم!': 'Westworld Café hosts acoustic jazz tonight!',
  'بوکمارک فصل جدید کتاب صوتی آلموت ثبت شد.': 'New audiobook chapter bookmark saved for Alamut.',
  'نورپردازی نوآر با استریم مستقیم P2P بدون افت فریم.': 'Noir lighting with a direct P2P stream, no frame drops.',
  'فید ۶۰ فریم با زیرنویس هماهنگ‌شده و کانال تلگرام اختصاصی.': '60fps feed with synced subtitles and a dedicated Telegram channel.',
  'رکورد مستقیم میکسر با ساب‌بیس تنظیم‌شده برای فضای ریو برلین.': 'Direct mixer recording with tuned sub-bass for the Berlin rave space.',
  'لینک مستقیم استریم کافه برای کارهای تمرکزی شبانه.': 'Direct café stream link for late-night focus sessions.',
  'با بوکمارک خودکار و نوت‌برداری روی تایم‌کد برای اتاق کتابخانه اساسینز کرید.': 'Saved with auto-bookmark & timecode notes for the Assassin Archive room.',
  'این قطعه را هنگام بارش باران شنیدم و این چند سطر را نوشتم.': 'Heard this piece in the rain and wrote these few lines.',
  'پرونده جدید با هشدار اسپویل: قاتل اصلی توی سکانس فینال مشخص میشه!': 'New case with a spoiler warning: the real killer shows in the finale!',
  'بررسی کدهای ترمینال fsociety در اپیزود آخر سریال.': 'Decoding the fsociety terminal codes in the series finale.',
  'لحظه‌های وایس‌سیتی خودت را به اشتراک بگذار': 'Share your own Vice City moments',
  'فید زنده لئونیدا': 'Leonida live feed',
  'امشب با کلاب': 'Tonight with the club',
  'انتشار پست جدید': 'Publish new post',
  'پست فعال': 'active posts',
  'دقیقه پیش': 'minutes ago',
  'ساعت پیش': 'hours ago',
  'روز پیش': 'days ago',
  'تارا · فرمانده': 'Tara · commander',
  'پارسا · کاپیتان': 'Parsa · captain',
  'نیما · اسنایپر سند': 'Nima · sand sniper',
  'رنگ بنفش متالیک زیر نور غروب': 'metallic purple under the sunset light',
  'دیوانه کننده ست!': 'it’s insane!',
  'میام میتینگ.': 'I’m coming to the meeting.',
  'یاد, جاده ساحلی رو باز نگه دارید!': 'guys, keep the coastal road clear!',
  'خصوصی (': 'private (',
  'به @': 'to @',
  'بعد از برد 5': 'after the 5–',
  'امشب, کل تیم رو آوردیم': 'tonight we brought the whole team',
  'کیز روی قایق تندرو': 'keys to the speedboat',
  'هر کی تو': 'anyone in',
  'عضو باشه آخر هفته': 'is a member — this weekend',
  'جایزه دار داریم!': 'we have a prize run!',
  'جلسه هماهنگی': 'coordination session',
  'بزرگ بانک مرکزی روی تراس': 'big central-bank job on the terrace',
  'نفر راننده و هکر حرفه ای برای': 'need a driver and a pro hacker for',
  'می خوایم': 'we want',
  'درخواست': 'request',
  'یا عضویت': 'or membership',
  'بدید.': 'submit.',
  'امشب با کوپه تیونینگ شده کل بلوار': 'tonight with the tuned coupe we took the whole boulevard',
  'کشیدیم! پلیس 5 ستاره افتاد دنبالمون ولی اسکواد': 'drifting! 5-star police chased us but the squad',
  'تو 2 دقیقه گمشون کرد.': 'lost them in 2 minutes.',
  'کی پایه میتینگ امشبه': 'who’s in for tonight’s meeting',
  'بندر لئونیدا': 'Leonida port',
  'فرمانده': 'commander',
  'کاپیتان': 'captain',
  'ارسال': 'Send',
  'مقر': 'HQ',
  'دوست': 'friend',
  'شعر و فلسفه': 'poetry & philosophy',
  'نگارش برگه': 'Write a sheet',
  'نشان های قلم': 'ink marks',
  'برگه': 'sheet',
  'افزودن برگه': 'Add sheet',
  'برگه های تازهٔ شعر': 'new poetry sheets',
  'نشانک ها': 'bookmarks',
  'صفحه': 'page',
  'هم صحبت': 'interlocutor',
  'دیشب': 'Last night',
  'صوتی': 'audio',
  'نوشته ها و آواها': 'notes & melodies',
  'دفتر': 'ledger',
  'تأملات شبانه': 'night reflections',
  'نوای تار': 'tar melody',
  'در سکوتِ میانِ دو نت، شعر آغاز می‌شود': 'In the silence between two notes, poetry begins',
  'شمس آرا تبریزی': 'Shams Ara Tabrizi',
  'و داستان های صوتی': '& audio stories',
  'پسندیدم': 'Liked',
  'شنیدن در تالار': 'Listen in the hall',
  'ثبت': 'Save',
  'دقیقه': 'min',
  'افزودن': 'Add',
  'یادداشت های یک کافه': 'Notes of a café',
  'گرامافون بارانی': 'rainy gramophone',
  'مثنوی شبانه و نوای سه تار': 'Nightly Masnavi & tar melody',
  'فلسفهٔ زیستن': 'philosophy of living',
  'زمان': 'time',
  'اپیزود دوازدهم': 'episode twelve',
  'در سکوتِ میانِ دو نت، شعر آغاز می‌شود.': 'In the silence between two notes, poetry begins.',
  'از نیستان تا مرا ببریده‌اند...': 'From the reed-bed they cut me away…',
  'آنجا که کلام بازمی‌ماند، نغمه آغازِ سلوک است.': 'Where words remain, the melody of the journey begins.',
  'باران بهترین هم‌نوازِ نت‌های ناتمام است.': 'Rain is the best duet partner for unfinished notes.',
  'دمی که در دستِ ماست، تنها حقیقتِ هستی‌ست.': 'The moment in our hands is the only true existence.',
  'هر چه بگویی و هر چه بنویسی، نشانِ جست‌وجوی توست.': 'All you say and write is the trace of your search.',
  'پرسشِ درست، نیمی از راهِ روشن‌شدنِ ذهن است.': 'The right question is half the path to a clear mind.',
  'فلسفه و موسیقی': 'philosophy & music',
  'فصل': 'chapter',
  'هر چه در خاطرهٔ شب به قلم می‌آید، در دلِ ساز به آوازِ رهایی می‌رسد...': 'Whatever the night’s memory writes down, in the heart of the instrument it reaches the melody of release…',
  'دیشب کنار شمع، فصل سوم «نامه‌هایی به یک دوستِ نادیده» را با همراهی نوای سه‌تار خواندم و ضبط کردم. اگر دلتان آرامش و اندیشه می‌خواهد، این برگه را همراه با صدا بشنوید و حاشیه‌تان را پایین بنویسید.': 'Last night by candlelight I read and recorded chapter three of “Letters to an Unseen Friend” with the setar. If your heart wants calm and thought, listen to this sheet with the audio and write your margin note below.',
  'دفتر شعر و دوات شمع': 'Poetry ledger & candle inkwell',
  'کتابخانه قدیمی و شمع': 'Ancient library & candlelight',
  'آن مکثِ میانِ مصراع دوم و صدای باران، دقیقاً حسِ ورق‌زدن یک دیوان کهنه را زنده می‌کند.': 'That pause between the second verse and the sound of rain revives the feeling of leafing through an old divan.',
  'امروز روی میز چوبی کنار پنجره، اتود جدید پیانو و گرامافون را برای ساعت‌های مطالعه و نوشتن ضبط کردم. فایل مستقیم را پیوست کرده‌ام تا هنگام خواندنِ متن‌ها در پس‌زمینه بنوازد.': 'Today by the window on the wooden desk I recorded the new piano étude and gramophone for study & writing hours. I attached the direct file so it plays in the background while you read.',
  'در این شماره از پادکست، دربارهٔ فلسفهٔ «زیستن در لحظهٔ اکنون» نزد خیام و رواقیون گفت‌وگو کرده‌ایم. نظرتان را دربارهٔ پرسشِ پایانی کتاب برایم بنویسید.': 'In this podcast issue we talk with Khayyam and the Stoics about the philosophy of “living in the present”. Write me your take on the book’s final question.',
  'ما نه از گذشتنِ ساعت‌ها، بلکه از نشنیدنِ صدای خویش پیر می‌شویم.': 'We don’t grow old from passing hours — we grow old from not hearing our own voice.',
  'محفل پادکست و فلسفهٔ زیستن': 'Podcast & philosophy-of-living circle',
  'پادکست دفتر زمان · اپیزود ۱۲': 'Time Ledger podcast · episode 12',
  'پادکست فلسفی · رواقی‌گری · اندیشه': 'Philosophy podcast · Stoicism · thought',
  'پادکست فلسفی': 'Philosophy podcast',
  'کافهٔ پیانو، بلوز و خوانشِ کتاب': 'Piano café, blues & book readings',
  'موسیقی، زبانِ ناگفتهٔ جملاتی‌ست که هیچ جوهری یارای نوشتنِ آن‌ها را نداشت.': 'Music is the unspoken language of sentences no ink could ever write.',
  'پیانو و باران کافه · ۸۴ ضرب در دقیقه': 'Piano & Rain Café · 84 BPM',
  'سوفیا هانا': 'Sofia Hana',
  'نیما سپهر': 'Nima Sepehr',
  'ضرب در دقیقه': 'BPM',
  'گفت وگوی فلسفی دربارهٔ': 'philosophical conversation about',
  'و حافظه': '& memory',
  'پادکست': 'podcast',








  'لایک': 'Like',
  'دیسلایک': 'Dislike',
  'کامنت': 'Comment',
  'اشتراک گذاری': 'Share',
  'زنده': 'live',
  'هایست امشب': 'heist tonight',
  'میتینگ': 'meeting',
  'اسکواد': 'squad',
  'لابی': 'lobby',
  'رکورد': 'record',
  'کل تیم': 'the whole team',
  'قایق تندرو': 'speedboat',
  'هکر حرفه ای': 'pro hacker',
  'نفر راننده': 'a driver',
  'جاده ساحلی': 'coastal road',
  'پلیس 5 ستاره': '5-star police',
  'کوپه تیونینگ شده': 'tuned coupe',
  'بلوار': 'boulevard',
  'ساعت 23': '11 PM',
  'دیوانه کننده': 'mind-blowing',
  'جایزه دار': 'prize',
  'آخر هفته': 'weekend',
  'درخواست عضویت': 'membership request',
  'جلسه هماهنگی سرقت': 'heist coordination session',
  'بانک مرکزی': 'central bank',
  'تراس': 'terrace',
};


/** Translate a Persian UI string. Non-fa target languages get English. */
const SHORT_KEYS = new Set<string>();
const ESCAPED_LONG_KEYS: Array<{ key: string; en: string }> = [];
const ZWNJ = /\u200C/g;
function buildIndex(): void {
  const keys = Object.keys(FA_UI_DICTIONARY);
  for (const key of keys) {
    // Register a ZWNJ-normalized variant so keys match regardless of half-space style.
    const norm = key
      .replace(/[ً-ْٰ]/g, '')
      .replace(ZWNJ, ' ')
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
    if (norm !== key && !(norm in FA_UI_DICTIONARY)) FA_UI_DICTIONARY[norm] = FA_UI_DICTIONARY[key];
  }
  for (const key of Object.keys(FA_UI_DICTIONARY)) {
    if (key.length < 7) SHORT_KEYS.add(key);
    else ESCAPED_LONG_KEYS.push({ key, en: FA_UI_DICTIONARY[key] });
  }
  ESCAPED_LONG_KEYS.sort((a, b) => b.key.length - a.key.length);
}
buildIndex();

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function translateFaText(text: string, langCode: string): string {
  const base = langCode.toLowerCase();
  if (base === 'fa' || base === 'prs' || base.startsWith('fa-')) return text;
  if (!/[\u0600-\u06FF]/.test(text)) return text;
  // Normalize half-spaces and Persian digits so keys match regardless of typing style.
  let out = text
    .replace(/[ً-ْٰ]/g, '') // strip harakat (kasra/fatha/tanvin)
    .replace(ZWNJ, ' ')
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  // Long phrases first (plain substring replace is safe for them).
  for (const { key, en } of ESCAPED_LONG_KEYS) {
    if (out.includes(key)) out = out.split(key).join(en);
  }
  // Short keys only replace standalone words (prevents زن→Woman inside زنده).
  for (const key of SHORT_KEYS) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}\\u200C])${escapeRegExp(key)}(?![\\p{L}\\p{N}])`, 'gu');
    out = out.replace(re, FA_UI_DICTIONARY[key]);
  }
  // Persian punctuation → Latin equivalents
  out = out
    .replace(/[\u060C\u066C]/g, ',')
    .replace(/[\u061B]/g, ';')
    .replace(/[\u061F]/g, '?')
    .replace(/[\u00AB]|\u00BB/g, '"')
    .replace(/[\u2026]/g, '…');
  return out;
}

function translateTextNode(node: Text, langCode: string): void {
  const raw = node.nodeValue ?? '';
  if (!raw.trim() || !/[\u0600-\u06FF]/.test(raw)) return;
  const translated = translateFaText(raw, langCode);
  if (translated !== raw) node.nodeValue = translated;
}

function translateAttributes(el: Element, langCode: string): void {
  for (const attr of ['placeholder', 'title', 'aria-label']) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    const translated = translateFaText(value, langCode);
    if (translated !== value) {
      if (!originalValues.has(el)) originalValues.set(el, value);
      lastWritten.set(el, translated);
      el.setAttribute(attr, translated);
    }
  }
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'TEXTAREA']);

/** Remembers the value this engine last wrote, so React resets get re-translated. */
const lastWritten = new WeakMap<Node, string>();
/** Original (Persian) value before the first rewrite — used to restore on fa. */
const originalValues = new WeakMap<Node, string>();

function walk(root: Node, langCode: string): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      const textNode = current as Text;
      const raw = textNode.nodeValue ?? '';
      const written = lastWritten.get(current);
      const needsPass = /[\u0600-\u06FF]/.test(raw) && (written === undefined || written !== raw);
      if (needsPass) {
        const parent = textNode.parentElement;
        // Skip animated typewriter text — it renders prefix-by-prefix and must not be rewritten.
        const inTypewriter = parent?.closest('[aria-label]')?.getAttribute('aria-label') === textNode.nodeValue?.trim()
          || Boolean(parent?.closest('.typewriter'));
        const parentSkip = !parent || SKIP_TAGS.has(parent.tagName) || parent.getAttribute('data-no-translate') !== null || inTypewriter;
        if (!parentSkip) {
          const translated = translateFaText(raw, langCode);
          if (translated !== raw) {
            if (!originalValues.has(current)) originalValues.set(current, raw);
            lastWritten.set(current, translated);
            textNode.nodeValue = translated;
          } else {
            lastWritten.set(current, raw); // unknown content — do not reprocess forever
          }
        }
      }
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as Element;
      if (!SKIP_TAGS.has(el.tagName)) translateAttributes(el, langCode);
    }
    current = walker.nextNode();
  }
}

/** Restore every rewritten node back to its original Persian value. */
function restoreOriginal(): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      const original = originalValues.get(current);
      const written = lastWritten.get(current);
      if (original !== undefined && written !== undefined && current.nodeValue === written) {
        current.nodeValue = original;
      }
      lastWritten.delete(current);
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      for (const attr of ['placeholder', 'title', 'aria-label']) {
        const restored = originalValues.get(current);
        if (restored !== undefined) {
          const el = current as Element;
          if (el.getAttribute(attr) === (lastWritten.get(current) ?? '')) {
            el.setAttribute(attr, restored);
          }
          lastWritten.delete(current);
        }
      }
    }
    current = walker.nextNode();
  }
  pendingLang = '';
}

let observer: MutationObserver | null = null;
let pendingLang = '';
let rafHandle = 0;

function scheduleApply(langCode: string): void {
  pendingLang = langCode;
  if (rafHandle) return;
  // setTimeout, not rAF: background/idle browser tabs never tick rAF, so a
  // rAF-scheduled walk would hang forever and leave stale Persian text.
  rafHandle = window.setTimeout(() => {
    rafHandle = 0;
    walk(document.body, pendingLang);
  }, 16) as unknown as number;
}

/** Mount-once: translate everything now and keep new DOM translated. */
export function installGlobalLanguageOverride(langCode: string, active: boolean): void {
  if (!observer) {
    observer = new MutationObserver(() => {
      if (!pendingLang) return;
      scheduleApply(pendingLang);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  }
  if (active) {
    pendingLang = langCode;
    scheduleApply(langCode);
  } else {
    // Switching back to Persian → restore every original value.
    rafHandle = window.setTimeout(() => {
      rafHandle = 0;
      restoreOriginal();
    }, 16) as unknown as number;
  }
}
