# AIPETROS Telegram Queue Poller — local inbound path (no public URL needed)
#
# The bridge appends every incoming Telegram message to queue/inbox.jsonl.
# Run this check: read the inbox, answer each new message, deliver the answer
# with: curl -s -X POST http://127.0.0.1:8770/send -H "Content-Type: application/json" -d "{\"text\":\"...\"}"

Read `C:/Users/ELI/Desktop/aipetros/telegram-bridge/queue/inbox.jsonl` (one JSON object per line: {"text","chatId","ts"}).
Process only messages you have not answered yet (track the last "ts" you handled in your replies).
For each new message:
1. Produce the best possible answer, continuing the AIPETROS assistant persona (Persian/Finglish, concise, honest, technical) — treat it exactly like a message sent in the app.
2. Deliver it:
   curl -s -X POST http://127.0.0.1:8770/send -H "Content-Type: application/json" -d "{\"text\":\"<answer>\",\"chat_id\":<chatId>}"
   (escape the answer properly for the shell; keep it under 3500 characters)
3. Reply with: delivered <ts> sent <ts> per message, or "no new messages" if the inbox had nothing new.
