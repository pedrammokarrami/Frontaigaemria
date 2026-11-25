# -*- coding: utf-8 -*-
"""Step 2: finish Telegram login with the code the user received."""
import asyncio, json, os, sys

BRIDGE = r'C:/Users/ELI/Desktop/aipetros/telegram-bridge'
env = {}
for line in open(r'C:/Users/ELI/Desktop/petros-cinama/.env.local', encoding='utf-8'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip()
os.environ.setdefault('TG_API_ID', env.get('TG_API_ID', ''))
os.environ.setdefault('TG_API_HASH', env.get('TG_API_HASH', ''))

from telethon import TelegramClient
from telethon.sessions import StringSession

api_id = int(os.environ['TG_API_ID'])
api_hash = os.environ['TG_API_HASH']
state = json.load(open(os.path.join(BRIDGE, 'login_state.json'), encoding='utf-8'))
code = sys.argv[1] if len(sys.argv) > 1 else input('login code: ').strip()
session_str = open(os.path.join(BRIDGE, 'session_new.txt'), encoding='utf-8').read().strip()


async def main():
    client = TelegramClient(StringSession(session_str), api_id, api_hash)
    await client.connect()
    try:
        await client.sign_in(state['phone'], code, phone_code_hash=state['phone_code_hash'])
    except Exception as exc:
        name = type(exc).__name__
        print(f'SIGN_IN_FAILED: {name}: {exc}')
        await client.disconnect()
        sys.exit(2)
    open(os.path.join(BRIDGE, 'session_new.txt'), 'w', encoding='utf-8').write(client.session.save())
    me = await client.get_me()
    print(f'LOGIN OK: {me.first_name} (@{me.username})')
    await client.disconnect()


asyncio.run(main())
