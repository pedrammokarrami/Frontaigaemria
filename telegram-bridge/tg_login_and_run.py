# -*- coding: utf-8 -*-
"""Interactive local login: prompts for the 2FA password on YOUR PC (never in chat).
After successful login it saves the session and STARTS THE BRIDGE immediately."""
import asyncio, getpass, json, os

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
session_str = open(os.path.join(BRIDGE, 'session_new.txt'), encoding='utf-8').read().strip()


async def main():
    client = TelegramClient(StringSession(session_str), api_id, api_hash)
    await client.connect()
    password = getpass.getpass('Telegram 2FA password (hidden): ').strip()
    try:
        await client.sign_in(state['phone'], password=password, phone_code_hash=state['phone_code_hash'])
    except Exception as exc:
        print(f'FAILED: {type(exc).__name__}: {exc}')
        await client.disconnect()
        os.system('pause')
        return
    open(os.path.join(BRIDGE, 'session_new.txt'), 'w', encoding='utf-8').write(client.session.save())
    me = await client.get_me()
    print(f'LOGIN OK: {me.first_name} (@{me.username}) — session saved')
    print('Starting bridge...')
    await run_bridge(client)


async def run_bridge(client):
    from aiohttp import web
    import aiohttp

    WEBHOOK_FILE = os.path.join(BRIDGE, 'webhook_url.txt')
    last_chat = {'id': None}

    def load_webhook():
        return open(WEBHOOK_FILE, encoding='utf-8').read().strip() if os.path.exists(WEBHOOK_FILE) else ''

    async def handle_send(request):
        try:
            payload = await request.json()
        except Exception:
            return web.json_response({'error': 'bad json'}, status=400)
        text = str(payload.get('text', '')).strip()
        chat_id = payload.get('chat_id') or last_chat['id']
        if not text:
            return web.json_response({'error': 'empty'}, status=400)
        if not text.startswith('\U0001F916'):
            text = '\U0001F916 ' + text
        try:
            await client.send_message(chat_id if chat_id else 'me', text, parse_mode=None, link_preview=False)
            return web.json_response({'ok': True})
        except Exception as exc:
            return web.json_response({'error': str(exc)}, status=500)

    async def push_to_agent(text, chat_id):
        webhook = load_webhook()
        if not webhook:
            return
        try:
            async with aiohttp.ClientSession() as http:
                await http.post(webhook, json={'path': '/tg-message', 'text': text, 'chatId': chat_id},
                                timeout=aiohttp.ClientTimeout(total=10))
        except Exception as exc:
            print(f'webhook POST failed: {exc}')

    from telethon import events

    @client.on(events.NewMessage(outgoing=True, chats='me'))
    async def on_saved(event):
        text = (event.message.message or '').strip()
        if not text or text.startswith('\U0001F916'):
            return
        last_chat['id'] = event.chat_id
        await push_to_agent(text, event.chat_id)

    @client.on(events.NewMessage(incoming=True))
    async def on_incoming(event):
        text = (event.message.message or '').strip()
        if not text or text.startswith('\U0001F916'):
            return
        last_chat['id'] = event.chat_id
        await push_to_agent(text, event.chat_id)

    app = web.Application()
    app.router.add_post('/send', handle_send)
    app.router.add_get('/health', lambda r: web.json_response({'ok': True, 'webhook': bool(load_webhook())}))
    webhook = load_webhook()
    print(f'BRIDGE ONLINE — sender http://127.0.0.1:8770/send | webhook configured: {bool(webhook)}')
    if not webhook:
        print('NOTE: no webhook_url.txt yet — incoming messages cannot wake the agent until remote access is set up.')
    print('Type a message to yourself (Saved Messages) to talk to the agent.')
    web.run_app(app, host='127.0.0.1', port=8770, print=None)


asyncio.run(main())
