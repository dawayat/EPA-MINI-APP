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

If the editor reports a database deadlock, wait until active API requests finish and run the same migration again. The migration is idempotent, so already-created columns and tables are skipped safely.

## Telegram Mini App channel posts

Configure the bot's **Main Mini App** in @BotFather with the deployed HTTPS application URL. Then set these Vercel environment variables:

```text
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_ID=@epaminiapp
TELEGRAM_BOT_USERNAME=your_bot_username_without_the_at_sign
```

Optional: set `TELEGRAM_MINI_APP_SHORT_NAME` when using a named Direct Mini App rather than the Main Mini App. The publisher generates Telegram's `t.me` Mini App link, which opens inside Telegram instead of treating the deployed URL as an external website.

## Stack
- React
- Vite
- TypeScript
