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

## Stack
- React
- Vite
- TypeScript
