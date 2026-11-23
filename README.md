# Atlas Copco parts specialist landing page

A static landing page for genuine Atlas Copco Power Technique parts, styled to the
Atlas Copco Brand Identity Manual. There is no build step. Vercel serves the files as they are.

## Files

| File          | What it is                                                    |
| ------------- | ------------------------------------------------------------- |
| `index.html`  | The whole page: markup, styles, and the callback form script  |
| `logo.svg`    | Atlas Copco gradient logotype                                 |
| `vercel.json` | Security headers and caching for the logo                     |

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import this repository.
2. Leave **Framework Preset** set to **Other**. Leave the build command and output directory empty.
3. Deploy. To use a custom domain, add it under **Settings → Domains**.

Every push to `main` deploys to production. Pushes to other branches get preview URLs.

## Before going live

- **Callback form:** the form sends nowhere until `CALLBACK_ENDPOINT` is set at the top of the
  script in `index.html`. Until then, it asks visitors to call instead.
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
