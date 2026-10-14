# Supabase setup

1. Create a Supabase project.
2. In **Project Settings → API**, copy the project URL and public anon key into `src/js/supabase-config.js`. Never put a service-role key in browser code.
3. Run `schema.sql` in the Supabase SQL Editor. The schema enables row-level security and creates the profile-on-signup trigger.
4. In **Authentication → Users**, create and confirm the founder account using `kgmultisectorlimited@gmail.com`. Set its password there; do not put passwords in source code.
5. Run `bootstrap-admin.sql` in the SQL Editor to attach that Auth user to the founder profile and grant the admin role.
6. Change any password previously shared in chat or entered into browser code before using the project live.
7. Serve the `src` directory over HTTP (not `file://`) and sign in at `login.html`.

Auth sessions are managed by Supabase. The browser uses the public anon key only; database access is restricted by the RLS policies in `schema.sql`. Static pages are also guarded client-side for user experience, but RLS is the authorization boundary.

The latest schema also creates the private `community-media` Storage bucket and policies for profile photos, application photos, event/forum/resource uploads, and direct-message attachments restricted to the conversation participants. Run the full latest `schema.sql` in the SQL Editor before using uploads.

If an existing project already has the schema, run `direct-message-storage-policy.sql` in the Supabase SQL Editor to update the private message-attachment read policy. It uses a restricted `SECURITY DEFINER` check because profile RLS intentionally hides the other conversation participant's profile row. The bucket remains private, and only a sender or recipient can read an attachment tied to their conversation.

For voice notes and one-to-one audio/video calls in Messages, run `message-calls-and-voice-notes.sql` in the SQL Editor. It adds the WebM audio type, a participant-scoped call invitation table, participant-restricted Realtime signaling policies, and a message policy that permits replies in existing conversations when a member has disabled new conversations. Existing conversations remain open for messages, voice notes, and calls; starting a new conversation still requires the recipient to allow direct messages. Calls require HTTPS and microphone/camera permission; the initial WebRTC setup uses a public STUN service, so network addresses may be visible to the STUN service and call participant. Networks that block peer-to-peer traffic may require a TURN service for reliable calling. Re-run this migration after deploying any updated message or call access rules.

For an existing project, run `member-notifications.sql` in the SQL Editor to categorize targeted message and connection alerts, notify members when events or community conversations are published, and enable Realtime updates for mobile navigation badges. This migration preserves recipient-only message notifications and applies the notifications table's existing owner-scoped RLS policies. New projects get the same setup from the latest `schema.sql`.

For an existing project, run `event-details-and-attendees.sql` in the SQL Editor to add the administrator-only function used to view the member names, email addresses, and reservation dates for each event. The Events and Conversations pages provide full event/session details, and attendee information is returned only after the database verifies the caller's admin role. New projects get the same function from the latest `schema.sql`.

Application approval does not sign the applicant in. In the admin dashboard's **Applicant account setup** panel, choose an approved application and generate a one-time code; send it privately using WhatsApp. The applicant enters that code, the same application email, and a chosen password on `login.html`. The code expires after 15 minutes, allows at most five incorrect attempts, and is consumed before account creation. Supabase Auth creates a confirmed user server-side, and the existing auth trigger creates and links the member profile.

Run the latest `schema.sql`, then run `whatsapp-setup-codes.sql` in the Supabase SQL Editor. The updated auth trigger honors the exact application ID supplied by the verified redemption function. From the repository root, link the project and deploy:

```powershell
supabase functions deploy create-applicant-whatsapp-code
supabase functions deploy redeem-applicant-whatsapp-code --no-verify-jwt
supabase secrets set SITE_URL=https://kgmultisectorlimited.github.io/CEOs-ENTREPRENEURS-NETWORK
```

The redemption function is public because the applicant has not authenticated yet; it enforces code verification, expiry, one-time use, the approved-application requirement, and attempt limits server-side. If deploying through the Supabase Dashboard, disable **Verify JWT** for `redeem-applicant-whatsapp-code`. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Never place the service-role key in website code. Email SMTP is not needed for this account-setup flow.

Annual subscriptions are recorded for manual review only. Members submit their MTN Mobile Money transaction reference, and administrators verify payment against the recipient account. No MTN/Airtel merchant API credentials or automatic payment confirmation are used by the static site.
