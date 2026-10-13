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

Application approval does not sign the applicant in. With the invitation function deployed and email configured, approval sends an account invitation to the applicant. The auth trigger permits account creation only for an approved application, creates the member profile from that application, and associates the Auth user with the application. The email link returns to the password setup screen; the applicant must set their password before signing in. The admin dashboard's member count includes member profiles, not pending applications or admin accounts.

For this flow, enable email signups and email confirmation under **Authentication → Providers → Email**, and allow the deployed `login.html` URL under **Authentication → URL Configuration**. The admin must contact an approved applicant with these setup instructions; approval alone does not send an invitation.

For automatic invitations on approval, deploy `functions/send-member-invitation` with the Supabase CLI and set the `SITE_URL` function secret to the deployed website root. Supabase Edge Functions provide `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` server-side; never put the service-role key in website code. Configure custom SMTP under **Authentication → SMTP Settings** for reliable delivery. The Edge Function validates the signed-in admin's profile, verifies the application is approved, and invites the applicant to set their password at `login.html?account-setup=1`. If automatic sending fails, an admin can retry from the approved application row.

Annual subscriptions are recorded for manual review only. Members submit their MTN Mobile Money transaction reference, and administrators verify payment against the recipient account. No MTN/Airtel merchant API credentials or automatic payment confirmation are used by the static site.
