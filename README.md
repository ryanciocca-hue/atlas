# Atlas Copco parts specialist landing page

A static landing page for genuine Atlas Copco Power Technique parts, styled to the
Atlas Copco Brand Identity Manual. There is no build step. Vercel serves the files as they are.

## Files

| File          | What it is                                                    |
| ------------- | ------------------------------------------------------------- |
| `index.html`  | The whole page: markup, styles, and the callback form script  |
| `logo.svg`    | Atlas Copco gradient logotype                                 |
| `vercel.json` | Security headers and caching for the logo                     |
| `api/callback.js` | Vercel function that emails each callback request          |
| `package.json` | Declares `nodemailer`, which the function uses to send email |

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import this repository.
2. Leave **Framework Preset** set to **Other**. Leave the build command and output directory empty.
3. Deploy. To use a custom domain, add it under **Settings → Domains**.

Every push to `main` deploys to production. Pushes to other branches get preview URLs.

## Callback form email

The "Request a callback" form posts to `/api/callback`, which sends one email per request to
every address in `LEAD_RECIPIENTS`. The email's Reply-To is set to the customer, so replying
reaches them directly.

Set these under **Vercel → Settings → Environment Variables**, then redeploy:

| Variable          | Value                                                              |
| ----------------- | ------------------------------------------------------------------ |
| `SMTP_USER`       | The Gmail address that sends the emails                            |
| `SMTP_PASS`       | A Gmail **App Password** for that account, not its normal password |
| `LEAD_RECIPIENTS` | Comma-separated list of the addresses that should receive requests |

To create the App Password, turn on 2-Step Verification for the Gmail account, then go to
myaccount.google.com/apppasswords and create a password for this site. Gmail allows about 500
emails a day, which is far more than this form needs.

To send through another provider, also set `SMTP_HOST` and `SMTP_PORT`. The defaults are
`smtp.gmail.com` and `465`.

If the variables are missing or the login fails, the form tells the visitor to call
(800) 732-6762, and the reason appears in Vercel's function logs.

Spam protection: the form has a hidden field that people never see but bots fill in. The
function ignores any request with that field filled, and rejects posts from other websites.

## Before going live

- **Google Ads:** the tag `AW-18203060759` and its conversion label are in `<head>`. The
  conversion fires when a callback request is submitted successfully.
- **Phone number:** (800) 732-6762 appears in several places in `index.html`. Search for
  `732-6762` to change it.

## Brand reference

- Typeface: Source Sans. Headlines are semibold, body text is regular, and all text is sentence case.
- Colors: Atlas Copco blue `#0092BC`, Blue 11 `#006F8F` (links), Gray 11 `#2F363A` (headings),
  Gray 09 `#5B6770` (body), and Beige `#F5F2EF` (section backgrounds).
- Gradients use stops at 4%, 48%, and 96–98%.

These values are defined as CSS variables at the top of the `<style>` block in `index.html`.
