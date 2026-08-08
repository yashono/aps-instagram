# Aaryash Instagram AI Agent

Instagram DM agent for **Aaryash Printing Solutions**.

- First-time contacts get a fixed welcome message with office address and phone
- Follow-up replies are generated with OpenAI in Hindi / Hinglish / English
- Built for deploy on Railway Hobby

## Features

1. Meta webhook verification (`GET /webhook`)
2. Incoming DM handling (`POST /webhook`) with signature verification
3. First-contact welcome template (address + phone + hours)
4. Human-like OpenAI replies with short chat history
5. SQLite persistence for users and messages

## Requirements

- Node.js 20+
- Meta App with Instagram Messaging configured
- Long-lived Page Access Token
- OpenAI API key
- Railway Hobby account (for production)

## Local setup

```bash
cp .env.example .env
# fill VERIFY_TOKEN, APP_SECRET, PAGE_ACCESS_TOKEN, OPENAI_API_KEY

npm install
npm run dev
```

Health check: `http://localhost:3000/health`

For local Meta testing, use a tunnel (ngrok) and point the webhook to  
`https://<tunnel>/webhook`.

Optional local-only flag:

```env
SKIP_SIGNATURE_VERIFICATION=true
```

Never enable that in production.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VERIFY_TOKEN` | Yes | Any secret string you choose for Meta webhook verify |
| `APP_SECRET` | Yes | Meta App Secret |
| `PAGE_ACCESS_TOKEN` | Yes | Long-lived Page token with Instagram messaging |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `DATABASE_PATH` | No | Default `./data/bot.db` |
| `PORT` | No | Default `3000` (Railway sets this) |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |

## Railway Hobby deploy

1. Push this repo to GitHub.
2. In Railway, create a new project from the repo.
3. Add a volume mounted at `/data`.
4. Set environment variables:
   - `VERIFY_TOKEN`
   - `APP_SECRET`
   - `PAGE_ACCESS_TOKEN`
   - `OPENAI_API_KEY`
   - `DATABASE_PATH=/data/bot.db`
5. Deploy and copy the public HTTPS domain.
6. In Meta App → Webhooks:
   - Callback URL: `https://<your-railway-domain>/webhook`
   - Verify token: same as `VERIFY_TOKEN`
   - Subscribe to `messages` (Instagram / Page as configured in your app)
7. Send a DM from a new Instagram account and confirm:
   - Welcome message with address/phone arrives first
   - AI reply follows for the user’s question

### Build / start commands

Railway can detect Node automatically. Explicit settings:

- Build: `npm install && npm run build`
- Start: `npm start`

## First-contact message

New users receive:

- Office address (Durg)
- Phone: +91-9459452277
- Hours: Mon–Sat, 9 AM – 6 PM
- Short services intro

Returning users only get the AI reply (address is not repeated every time).

## Project structure

```text
src/
  index.ts
  config.ts
  webhook.ts
  ai/
  db/
  meta/
  templates/
```

## Notes

- Reply within Meta’s 24-hour messaging window for free-form text.
- The bot does not invent prices or delivery dates.
- Upgrade Railway Hobby → Pro later from workspace billing if you need higher limits.
