# Articles of Association reader

The reader is integrated in all three member portals and the admin's **Articles & Bylaws** tab. It starts hidden. The document is an encrypted, server-only extraction of the supplied Word file, with the original paragraph text and automatic clause numbering preserved. The contents page is replaced by article navigation. It is never included in the frontend bundle or public directory.

## Setup

The additive setup in `supabase/bylaws.sql` has been applied to EPA's project `cnwkuzihcmtenpoliqpn`. It enables RLS, denies browser roles, and grants access only to `service_role`. The articles' visibility was explicitly verified as disabled after setup. Keep visibility disabled until an administrator activates the reader.

The existing server Supabase service-role configuration and admin/member session secrets are required. `EPA_BYLAWS_CONTENT_KEY` is a server-only production secret in Vercel containing the 32-byte AES key encoded as 64 hexadecimal characters. Never prefix it with `VITE_`. The API uses the existing announcements function's `action=bylaws` route. Deploy the application, sign in as admin, and activate the reader when ready for members.

To update the document, run `./scripts/import-bylaws.ps1` from the repository root with the replacement source in place, review the extracted text and clause numbering, then run `node scripts/encrypt-bylaws.mjs`. This reuses the ignored local key in `tmp/bylaws-content-key`, or generates a new key on a fresh workstation. Ensure the production key matches before deploying the encrypted document. The original DOCX is not served to members.

The GitHub repository is public. Do not commit the original DOCX, the encryption key, or `server-data/bylaws.json` to it; `.gitignore` excludes them. Only the AES-256-GCM ciphertext (`server-data/bylaws.encrypted.json`) is committed. Authentication and access checks run before decryption. Missing or incorrect production keys fail closed. The existing Git integration deploys pushes to `main`. `.vercelignore` also excludes original Word files, local environment files, test outputs, and temporary tooling from CLI uploads.

## Protection and practical limits

Every content request verifies a signed member session, database membership status, global activation, and individual restrictions. Responses use `private, no-store`; all admin operations require a signed admin session. Member identity and event time are assigned on the server. Suspended and pending members cannot access content. Active and expired approved members can read when enabled.

Open readers revalidate every 15 seconds and clear content on any failed check. A 25-second verification lease clears content if a network request stalls. Already delivered content cannot be recalled. The reader suppresses common copy/save/print shortcuts, context menus, drag and selection, and hides itself in print layouts. Personal watermarks deter redistribution. Content is hidden while the window is inactive. These are deterrents; a determined authorized reader can extract delivered text using browser tools.

Websites cannot reliably detect or block OS screenshots, screen recording, another camera, or capture by other applications. A capture shortcut event means only that the browser observed a key combination; it is not evidence that a screenshot occurred. Blur and visibility changes are not logged as capture events. Activity reports can be forged or suppressed by the client. Never automatically penalize members based on these events. Administrators can review the latest 100 events, restrict an individual, restore access, or deactivate globally.

The deployment sends `Permissions-Policy: display-capture=()` to disable this application's own use of `getDisplayMedia()` where supported. This does not stop another website, extension, browser, or operating system from capturing the reader. Managed browser policies or a native application can provide additional platform-specific enforcement; those controls cannot be installed on members' personal browsers by this website. Telegram's protected chat messages are separate from its Mini App API, which currently documents no screenshot prevention method.

Vercel explicitly bundles `server-data/bylaws.encrypted.json` into the announcements server function using `includeFiles`, without publishing it as a static file.

## Verification

Run `npm run lint`, `npm run build`, and `node --test tests/bylaws*.test.mjs`. Tests cover authentication, identity spoofing, inactive access, activation, individual restriction/restoration, deactivation, private caching, trusted event attribution, and authenticated encryption/tamper rejection. The encryption script also verifies all 31 source article headings before preparing a release.
