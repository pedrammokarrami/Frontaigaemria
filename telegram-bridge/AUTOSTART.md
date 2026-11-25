# AIPETROS Telegram Bridge — راهنما

پل زنده بین تلگرام و اپلیکیشن AIPETROS.

## اجرا

```
START_BRIDGE.bat
```
(یا `python aipetros_tg_bridge.py`)

برای اجرای خودکار با هر بار روشن شدن PC، این فایل `.bat` را به Startup پروژه کپی کن:
`C:\Users\ELI\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`

## جریان کار

| مسیر | توضیح |
|---|---|
| تلگرام → اپ | هر پیامی که در **Saved Messages** خودت یا DM بفرستی، به `queue/inbox.jsonl` اضافه و خودکار توسط پل پاسخ داده می‌شه |
| اپ → تلگرام | `POST http://127.0.0.1:8770/send` با `{"text":"...", "chat_id": <id>}` |

## سرویس‌ها

- پل: `http://127.0.0.1:8770` (health / send / inbox / test-answer)
- سرور AIPETROS: `http://127.0.0.1:3000` (باید روشن باشه)

## فایل‌ها

- `aipetros_tg_bridge.py` — خود پل
- `session_new.txt` — نشست تلگرام (**محرمانه — commit نکن**)
- `login_state.json` — وضعیت ورود
- `queue/inbox.jsonl` — صف پیام‌های ورودی
- `webhook_url.txt` — اگر Remote Access روشن بشه، آدرس webhook اینجا (اختیاری)

## نکات امنیتی

- `TG_API_ID` / `TG_API_HASH` از `C:/Users/ELI/Desktop/petros-cinama/.env.local` خوانده می‌شود.
- رمز 2FA فقط محلی وارد می‌شود، هیچ‌جا ذخیره نمی‌شود.
- `session_new.txt` را هرگز به git push نکن (در `.gitignore` هست).
