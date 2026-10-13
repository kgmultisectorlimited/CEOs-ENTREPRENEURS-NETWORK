# KG CEC Network Website

## Overview
KG CEOs & Entrepreneurs Network (KG CEC NETWORK) is the executive community website operated by KG Multisector Limited. It helps business leaders apply for membership, connect, participate in conversations and events, and access member resources.

## Project Structure
The project is organized as follows:

```
kg-multisector-limited
├── src
│   ├── index.html        # Main HTML document
│   ├── css
│   │   └── styles.css    # Styles for the web application
│   └── js
│       └── main.js       # JavaScript functionality
├── package.json          # npm configuration file
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites
- Node.js and npm should be installed on your machine.

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/kg-multisector-limited.git
   ```
2. Navigate to the project directory:
   ```
   cd kg-multisector-limited
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To run locally, start a static web server with `npm start`, then open the address printed by the server. Opening the HTML file directly is not recommended for authentication callbacks.

## Publish with GitHub Pages
The workflow in `.github/workflows/pages.yml` publishes the contents of `src/` whenever a commit is pushed to `main`.

1. Push this project to a GitHub repository on the `main` branch.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the deployment source if it is not already selected.
3. Open the **Actions** tab and wait for **Deploy website to GitHub Pages** to complete successfully.
4. Copy the deployed URL shown in the workflow run's deployment environment.
5. In Supabase, open **Authentication → URL Configuration**. Set **Site URL** to the deployed website root, and add the exact deployed `login.html` URL as an allowed redirect URL. For a project site, this will look like `https://OWNER.github.io/REPOSITORY/login.html`; for a user or organization site, it will look like `https://OWNER.github.io/login.html`.
6. Test the public homepage, sign-in, and password-reset flow from the deployed URL before inviting members.

The repository must be connected to GitHub and pushed before the workflow can deploy. The working folder used during development was not connected to a Git repository, so deployment still requires pushing these files to the intended GitHub repository.

## Supabase Setup
Database-backed pages use the Supabase project configured in `src/js/supabase-config.js`. When applying database updates, run the latest `supabase/schema.sql` in that project's Supabase SQL Editor. The schema includes event RSVPs, forum moderation reports, private messages, resource-library entries, connection requests, notifications, subscription-payment review, and row-level security policies. The private `community-media` Storage bucket supports member and applicant profile photos, direct-message and forum attachments, event media, and resource files. Upload size is limited to 50 MB (profile photos to 5 MB) and access is controlled by Storage policies; direct-message attachments are available only to the conversation participants.

Annual network subscriptions are UGX 50,000 and currently use a manual MTN Mobile Money reference check. Members submit the payer phone number and transaction reference; an administrator must verify the payment before the one-year subscription is marked active. This is not an automatic payment integration or auto-renewal.

## Membership approval and account setup
Approving an application does not sign the applicant in. After the invitation function is deployed and email delivery configured, approval sends the applicant an email link to set a password. The database trigger creates the member profile only for an approved application; the applicant confirms their email and chooses a password before signing in. The member count includes linked member profiles.

Enable email signup and email confirmation in Supabase Auth, and ensure the deployed `login.html?account-setup=1` URL is an allowed redirect.

### Automatic approval invitations
The admin application review sends an account invitation when an application is approved. This uses the `send-member-invitation` Supabase Edge Function, which verifies the caller's admin profile before using the server-side Supabase Auth admin API. Never expose the service-role key in frontend code.

Deploy the function from the repository root after linking the Supabase project with the Supabase CLI:

```powershell
supabase functions deploy send-member-invitation
supabase secrets set SITE_URL=https://kgmultisectorlimited.github.io/CEOs-ENTREPRENEURS-NETWORK
```

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. In **Authentication → URL Configuration**, allow the deployed `login.html?account-setup=1` redirect. Configure a reliable SMTP sender in **Authentication → SMTP Settings**; Supabase's default email sender is rate-limited and intended for testing. The invite link opens the site password form; after choosing a password, the applicant is taken to the member dashboard. If an invitation fails after approval, the admin can use **Send account invitation** on the approved application.

The site includes Privacy Policy, Terms, and Community Guidelines pages. These operational policy drafts should be reviewed by qualified counsel for the applicable jurisdictions before being treated as complete legal advice.

Only the Supabase publishable/anon key belongs in the browser configuration. Never put a service-role key in frontend files. GitHub Pages serves the site publicly; keep member pages protected by Supabase authentication and row-level security.

## Usage
- The application provides various features tailored to different sectors. Users can navigate through the interface to access the services offered.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.