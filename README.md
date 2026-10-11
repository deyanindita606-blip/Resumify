# Resumify

A privacy-first resume and CV builder. Pick a layout (with or without a photo), fill in your details, choose colours and download as **PDF, Word or HTML**.

- Static site: plain HTML, CSS and JavaScript. No build step, no dependencies.
- Your data stays in the browser (`localStorage`). Nothing is sent to a server.
- Seven templates, live preview, photo upload with automatic circular crop, A4 print styles.
- Resume text is real, selectable text, so applicant tracking systems can read it.

## Project structure

```
index.html            Page markup (home, format choice, builder, footer, privacy gate)
vercel.json           Security headers and clean URLs for Vercel
package.json          Local dev and syntax-check scripts
assets/
  favicon.svg
  css/styles.css      App UI styles
  js/
    config.js         Brand, owner, contact email, policy date, storage keys
    sample.js         Sample resume shown on first load (Anindita Dey)
    resume.js         Resume renderer and template CSS (used by preview and exports)
    export.js         PDF, Word and HTML downloads
    policy.js         Privacy policy text, built from config.js
    app.js            State, wizard form, live preview, privacy gate
```

## Run locally

```bash
npm run dev        # serves on http://localhost:3000 (uses npx serve)
npm run check      # syntax-checks every script
```

Any static server works, or open `index.html` directly in a browser.

## Deploy

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Resumify"
   git branch -M main
   git remote add origin https://github.com/<your-username>/resumify.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com), choose **Add New, Project**, then import the repository.
3. Framework Preset: **Other**. Leave Build Command and Output Directory empty. Deploy.

## Customise

- Owner name, contact email and policy date: `assets/js/config.js`
- Sample resume content: `assets/js/sample.js`
- Colours and layout of the app: CSS variables at the top of `assets/css/styles.css`
- Resume templates: `assets/js/resume.js`

## Notes

- If you change the privacy policy materially, change `consentKey` in `config.js` (for example to `resumify.consent.v2`) so returning visitors are asked to accept again.
- The Word export is an HTML-based `.doc`. Sidebar layouts fall back to Classic there because Word does not support CSS grid.

## Licence

MIT
