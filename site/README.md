# Tap AI — website

The public-facing site. **Fully static: no server, no database, no environment
variables.** `npm run build` emits an `out/` directory of plain HTML, CSS and JS
that will run on GitHub Pages, Vercel, Netlify, S3, or off a USB stick.

This is deliberately decoupled from the MVP in the parent directory. The MVP
keeps its DuckDB warehouse and internal pages; the site shares none of it, so it
can never break because a local database wasn't built.

## Run it

```bash
cd site
npm install
npm run dev        # http://localhost:3100
```

## Build it

```bash
npm run build      # -> out/
npm start          # serve out/ locally to check the static build
```

## Share it

### Option 1 — GitHub Pages (free, no account beyond GitHub)

```bash
# from the repo root, once
gh repo create tap-ai --public --source=. --remote=origin --push
```

Then in the repo: **Settings → Pages → Source: GitHub Actions**.

`.github/workflows/deploy.yml` builds and publishes on every push to `main` that
touches `site/`. Your URL will be `https://<user>.github.io/tap-ai/`.

> The workflow sets `BASE_PATH=/<repo-name>` because Pages serves project sites
> from a subpath. Remove it if you attach a custom domain.

### Option 2 — Vercel (nicest URLs, preview deploys per branch)

```bash
cd site
npx vercel        # accept the defaults; set Root Directory to "site"
npx vercel --prod
```

`vercel.json` is already configured for the static output.

### Option 3 — hand someone a folder

```bash
npm run build
zip -r tap-ai-site.zip out
```

`out/index.html` opens in a browser with no server. Useful for sending to someone
who will not click a link, or for demoing without wifi.

## What's in here

```
src/app/page.tsx           The whole site. One page, sectioned.
src/app/layout.tsx         Metadata, viewport, nav.
src/components/
  site-nav.tsx             Sticky nav with a real mobile menu.
  walkthrough.tsx          Interactive 6-stage flow, 18 scenarios.
  values.tsx               The three values, with proof and objections.
  mobile-surfaces.tsx      The same tap in Slack and Claude, on a phone.
  visuals.tsx              Gap diagram, drift chart, comparison matrix.
  tap-anatomy.tsx          The tap primitive and its seven dimensions.
  ai-ledger.tsx            The decision ledger and its agent-facing format.
src/lib/
  scenarios.ts             18 hand-written scenarios, 6 industries x 3 classes.
  decision-ledger.ts       The AI-facing decision record format.
  tiers.ts                 Pricing tiers, inlined (the MVP reads YAML instead).
```

**Dependencies: next, react, react-dom, tailwind.** No chart library, no UI kit,
no data layer. Every chart is hand-rolled SVG, because a dependency that can fail
on install is a bad trade for a marketing page.

## Editorial rules

Worth stating, because they are easy to drift from on the next edit:

1. **Never frame engineers as the problem.** Nobody in the story is doing
   anything wrong — the expertise simply has no way in. Both groups are allies
   who each hold half of a whole.
2. **The three values are the spine.** Lightweight, governed, active. Every
   section is evidence for one of them.
3. **Lead with something operable.** Prose is the caption on a visual, not the
   argument itself.
4. **No adjective that a mechanism could replace.** "Safe" means PR review, SSO
   authority, decision logging and fail-closed defaults — say those instead.
