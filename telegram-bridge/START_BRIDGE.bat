@echo off
REM AIPETROS Telegram login + bridge starter — run this ONCE
REM The 2FA password is typed locally (hidden), never sent anywhere.
cd /d "C:\Users\ELI\Desktop\aipetros\telegram-bridge"
set PYTHONIOENCODING=utf-8
python tg_login_and_run.py
pause
