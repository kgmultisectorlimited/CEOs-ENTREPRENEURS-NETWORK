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

The workflow deploys changes from the connected repository's `main` branch after they are committed and pushed.

### Install the site as a desktop app
After GitHub Pages finishes deploying, open the website in Microsoft Edge or Google Chrome on a Windows PC or laptop and select **Install app** near the bottom-right of the page. Confirm the browser prompt. The app then opens in its own window and can be pinned to Start or the taskbar.

If the browser does not offer the install prompt, use **Install this site as an app** from Edge's **Settings and more → Apps** menu, or Chrome's **Customize and control → Cast, save, and share → Install page as app** menu. The site needs an internet connection for member pages and messages; the installed app shows an offline notice when disconnected.

On Android, open the website in Chrome and choose **Install app** or **Add to Home screen** from the browser menu. On iPhone or iPad, open it in Safari, tap **Share**, then choose **Add to Home Screen**.

## Supabase Setup
Database-backed pages use the Supabase project configured in `src/js/supabase-config.js`. When applying database updates, run the latest `supabase/schema.sql` in that project's Supabase SQL Editor. The schema includes event RSVPs, forum moderation reports, private messages, resource-library entries, connection requests, notifications, subscription-payment review, and row-level security policies. The private `community-media` Storage bucket supports member and applicant profile photos, direct-message and forum attachments, event media, and resource files. Upload size is limited to 50 MB (profile photos to 5 MB) and access is controlled by Storage policies; direct-message attachments are available only to the conversation participants.

Annual network subscriptions are UGX 50,000 and currently use a manual MTN Mobile Money reference check. Members submit the payer phone number and transaction reference; an administrator must verify the payment before the one-year subscription is marked active. This is not an automatic payment integration or auto-renewal.

## Membership approval and account setup
Approval does not sign the applicant in. In the admin dashboard's **Applicant account setup** panel, choose an approved applicant and select **Generate WhatsApp setup code**. Send the single-use code privately to the applicant. They enter the code, their application email, and a chosen password on `login.html`; the server validates the code and creates a confirmed Auth account. The existing database trigger creates and links the member profile. Codes expire after 15 minutes and are limited to five incorrect attempts. The member count includes linked member profiles.

Run the latest `supabase/schema.sql`, then run `supabase/whatsapp-setup-codes.sql` once in the Supabase SQL Editor. The auth trigger uses the exact application ID when creating a code-verified account, so duplicate applications with the same email cannot link the account to the wrong application. Deploy both Edge Functions from the repository root after linking the project:

```powershell
supabase functions deploy create-applicant-whatsapp-code
supabase functions deploy redeem-applicant-whatsapp-code --no-verify-jwt
supabase secrets set SITE_URL=https://kgmultisectorlimited.github.io/CEOs-ENTREPRENEURS-NETWORK
```

The redemption function intentionally has JWT verification disabled because applicants are not signed in yet; it validates the high-entropy server-hashed code, approved application, expiry, and attempt limit itself. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Keep the service-role key server-side only. The admin can generate a replacement code if one expires or account activation fails. No email delivery is required for this setup flow.

The site includes Privacy Policy, Terms, and Community Guidelines pages. These operational policy drafts should be reviewed by qualified counsel for the applicable jurisdictions before being treated as complete legal advice.

Only the Supabase publishable/anon key belongs in the browser configuration. Never put a service-role key in frontend files. GitHub Pages serves the site publicly; keep member pages protected by Supabase authentication and row-level security.

## Usage
- The application provides various features tailored to different sectors. Users can navigate through the interface to access the services offered.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.