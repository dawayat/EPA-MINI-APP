# EPA-MINI-APP

Ethiopian Psychologists Association membership portal and verification app.

## Features
- public member verification
- digital member ID card
- psychologist directory
- admin portal
- voting booth workflow
- notification center

## Run locally
1. Install dependencies: `npm install`
2. Start the app: `npm run dev`
3. Open the local app in your browser at http://localhost:3000

## Shared portal interactions

Before deploying this version, apply [the community-interactions migration](supabase/migrations/20260830_member_community.sql) in the Supabase SQL Editor. It adds the shared comments, member draft votes, messages, and announcement draft flag used by the portal.

Also apply [the media cleanup migration](supabase/migrations/20260901_remove_telegram_media_payloads.sql). It removes only redundant Telegram media copies and duplicate comment avatars, reducing PostgREST egress without removing announcement covers or attached files.

If the editor reports a database deadlock, wait until active API requests finish and run the same migration again. The migration is idempotent, so already-created columns and tables are skipped safely.

## Telegram Mini App channel posts

Set these Vercel environment variables:

```text
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_ID=@epaminiapp
```

Channel buttons use `https://t.me/EPAMINIAPP_bot/EPAPORTAL` by default, which opens the EPA Mini App inside Telegram. If it ever changes, set `TELEGRAM_MINI_APP_LINK` to the replacement `https://t.me/...` Mini App link.

## Stack
- React
- Vite
- TypeScript
