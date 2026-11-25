@echo off
REM AIPETROS Telegram Bridge — run once per PC boot
cd /d "C:\Users\ELI\Desktop\aipetros\telegram-bridge"
set PYTHONIOENCODING=utf-8
python aipetros_tg_bridge.py
pause
