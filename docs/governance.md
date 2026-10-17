# EPA governance voting

Production project: `cnwkuzihcmtenpoliqpn`. Setup: `supabase/governance.sql`; transaction/privilege verification: `supabase/governance.verify.sql` (always rolls back). Uses the existing signed member/admin sessions and existing announcement function via `action=governance`, avoiding another Vercel function.

## Admin workflow

- Articles & Bylaws: create the whole-document approval ballot; activate the articles separately; open voting; close the ballot. Options: Approve, Do not approve, Abstain. Names and member numbers of participating voters appear in a member-only voter register; aggregate choices are shown, individual choices are not listed.
- Elections: create an election for an executive position. Open nominations. Active FULL members submit their own statement (20–2000 characters). Review and approve candidates. Close nominations if desired, then open voting. Opening voting also closes nominations. At least one approved, currently eligible candidate is required. Close the ballot to show member results. Admins can see ongoing tallies and participation; individual election choices are not returned to either member or admin clients.
- New ballots are drafts, hidden from members. No feature is activated by deploying. Admins may reopen a closed vote. Once a ballot contains votes, nominations and candidate changes cannot reopen; create a new election for another round. No vote-reset or vote-delete feature exists.

Only ACTIVE FULL professional members may vote or self-nominate. Student, corporate, expired and pending memberships cannot participate. Session identity is verified at the API and rechecked against membership data inside the database transaction. The API ignores caller-supplied actor/admin identity. Anonymous database access is revoked, RLS is enabled, and the RPC can be executed only by the server service role.

Every submitted ballot is final. The database primary key `(poll_id,member_id)` prevents duplicates, including concurrent requests. The poll row is locked during nominations, votes, candidate approvals and phase changes, so a close/open operation cannot race a ballot. Membership rows are checked and share-locked for the write. Candidate ballots must reference an approved candidate in the same election. Articles voting also requires enabled/unrestricted access to the articles. Audit records persist admin changes and member participation without recording ballot choices in the audit stream.

Do not replace the source articles while their approval vote is open. Close the old ballot and prepare a new ballot for a new document revision. This feature does not decide quorum, legal validity, ties or winners; administrators review the final tally.

## QR code

`public/epa-website-qr.png` (1200px) and `.svg` encode `https://epa-mini-app.vercel.app/` directly, with a quiet zone and high error correction. Admin → Elections includes the QR preview and PNG/SVG downloads. Scanners open the destination URL; a phone may ask its user to tap the detected link.

## Validation

Run `npm run lint`, `npm run build`, `node --test tests/*.test.mjs`. API tests cover signed identity, spoofing, admin/member separation, expired status, full-member eligibility, final result visibility and private election choices. Run the SQL verification against the intended project to test actual transaction behavior and role grants. Mobile preview verified at 390px without horizontal page overflow. All preview UI actions use local fixtures; production voting remains closed.

Initial setup prepares one draft approval ballot when no articles ballot exists. It is hidden and voting is closed until the administrator activates the articles and opens voting. The previous local-only voting booth is replaced by the same authenticated governance component, so there is no parallel sample voting flow.
