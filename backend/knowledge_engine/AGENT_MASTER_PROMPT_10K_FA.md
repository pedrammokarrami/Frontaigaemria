# موتور ساخت بزرگ‌ترین منبع دانش ۱۰٬۰۰۰+ بازی دنیا (PC، کنسول، موبایل و تبلت)

برای رسیدن به یک **منبع ۱۰٬۰۰۰+ بازی واقعی، همیشه به‌روز (شامل نسخه‌های جدید ۲۰۲۶ مثل EA SPORTS FC 27، Call of Duty: Modern Warfare 4 و NBA 2K27) و چندپلتفرمی**، هیچ فایل استاتیک دستی کافی نیست؛ چون هم سریع قدیمی می‌شود و هم نگهداری دستی ۱۰٬۰۰۰ بازی ممکن نیست.

این پکیج (`world_10k_games_knowledge_engine.zip`) یک **پایپ‌لاین کاملاً رایگان (Zero-Cost / Open-Source)** است که ایجنت کدنویسی شما (Cursor، Google Antigravity یا Google AI Studio) می‌تواند روی سیستم یا **GitHub Actions رایگان** اجرا کند تا دیتابیس ۱۰٬۰۰۰+ بازی را به‌صورت خودکار بسازد و هر هفته آپدیت نگه دارد.

## منابع داده‌ای کاملاً رایگان متصل به این موتور

| منبع | پوشش و کاربرد | هزینه | لینک رسمی |
| --- | --- | --- | --- |
| **IGDB API (Twitch/Amazon)** | بیش از ۳۰۰٬۰۰۰ بازی روی PC، PS5، Xbox، Nintendo Switch 2، iOS و Android (شامل آخرین نسخه‌های ۲۰۲۶) | ۱۰۰٪ رایگان (حتی تجاری و برای LLM) | [IGDB API](https://www.igdb.com/api) |
| **RAWG API** | بیش از ۵۰۰٬۰۰۰ بازی روی ۵۰+ پلتفرم (موبایل، تبلت، کنسول و پی‌سی) | رایگان (تا ۱۰۰ هزار کاربر ماهانه) | [RAWG Docs](https://api.rawg.io/docs/) |
| **Wikidata SPARQL** | کاتالوگ جهانی بازی‌ها بدون نیاز به هیچ کلید API یا ثبت‌نام | ۱۰۰٪ رایگان و باز | [Wikidata Query](https://query.wikidata.org/) |
| **StrategyWiki MediaWiki API** | راهنماهای کامل مراحل، نقشه‌ها، کنترل‌ها و استراتژی‌ها | ۱۰۰٪ رایگان | [StrategyWiki](https://strategywiki.org/wiki/Main_Page) |
| **Speedrun.com API v1** | گلیچ‌ها، قوانین دسته‌بندی‌ها و تکنیک‌های پیشرفته ثبت‌شده | ۱۰۰٪ رایگان (بدون نیاز به API Key) | [Speedrun API](https://github.com/speedruncomorg/api/blob/master/version1/runs.md) |

## فایل‌های داخل پکیج `world_10k_games_knowledge_engine.zip`

1. **`fetch_10k_catalog.py`** — استخراج خودکار لیست **۱۰٬۰۰۰+ بازی برتر و جدیدترین نسخه‌ها** در تمام پلتفرم‌ها (PC، کنسول، گوشی و تبلت) با سه حالت `igdb`، `rawg` و `wikidata`.
2. **`harvest_10k_guides.py`** — خزنده هوشمند و قابل ادامه (Resumable) که برای هر ۱۰٬۰۰۰ بازی به‌صورت خودکار راهنماها، استراتژی‌ها و گلیچ‌ها را از StrategyWiki و Speedrun.com استخراج و ذخیره می‌کند.
3. **`build_10k_rag_db.py`** — تبدیل کل داده‌ها به فایل‌های **JSONL شاردبندی‌شده** (برای آموزش ایجنت و Fine-Tuning) + دیتابیس جستجوی محلی فوق‌سریع **SQLite FTS5** (با فیلتر پلتفرم `PC`، `Console` و `Mobile_Tablet` و بدون نیاز به سرور پولی).
4. **`.github/workflows/weekly_10k_sync.yml`** — ورک‌فلوی رایگان **GitHub Actions** که هر دوشنبه کل دیتاست را خودکار با جدیدترین نسخه‌های ۲۰۲۶/۲۰۲۷ همگام‌سازی می‌کند.

## پرامپت آماده کپی برای ایجنت کدنویسی شما (Cursor / Antigravity / AI Studio)

```text
You are building the World 10,000+ Multi-Platform Games Knowledge Engine for AIGAMERIA (Zero-Cost, Serverless, Free-First Architecture).

STRICT ARCHITECTURAL GUARDRAILS:
- Zero paid servers, zero paid vector DBs. Use local SQLite FTS5 (`porter unicode61`) + sharded JSONL + GitHub Actions free cron sync.
- Multi-platform coverage is mandatory: PC, Console (PS5, Xbox Series X/S, Nintendo Switch 2), Mobile & Tablet (iOS, iPadOS, Android).
- Always prioritize the newest franchise release (e.g., EA SPORTS FC 27 over FC 26, Call of Duty: Modern Warfare 4, NBA 2K27) and preserve official wiki/speedrun source URLs on every chunk.

EXECUTION STEPS:
1. Extract `world_10k_games_knowledge_engine.zip` into `/backend/knowledge_engine/`.
2. Configure free Twitch/IGDB credentials (`IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` from https://www.igdb.com/api) in `.env` and GitHub Secrets (or run `--source wikidata` immediately with zero API keys).
3. Run:
   - `python3 fetch_10k_catalog.py --source igdb --limit 10000`
   - `python3 harvest_10k_guides.py --max-games 500 --delay 0.35` (resumable; schedule via GitHub Actions to cover all 10,000 games)
   - `python3 build_10k_rag_db.py --build`
4. Wire `query_db(query, platform=...)` from `build_10k_rag_db.py` into our AI Gameplay Coach backend so players can filter tips, maps, strategies, and glitches by `PC`, `Console`, or `Mobile_Tablet` with sub-50ms latency.
```
