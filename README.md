# Vendio

> AI marketplace autopilot — turn item photos into complete marketplace listings and post them to Kijiji and Facebook Marketplace.

Vendio is a polished, single-page demo that guides the user through a calm, magical flow: connect marketplaces → upload photos → generate a listing with AI → review and edit → post → see the result on a live dashboard.

## Stack

- Next.js App Router (Turbopack)
- React + TypeScript
- Tailwind CSS v4
- Playwright (optional, for real Facebook Marketplace automation)
- OpenAI Vision (optional, for AI-generated descriptions)

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and walk through the full flow:

1. **Home** — hero, how-it-works, benefits, and a single "Get Started" CTA.
2. **Connect Marketplace** — visually connect Kijiji and/or Facebook Marketplace (demo UI only).
3. **Upload Photos** — drag-and-drop up to 8 photos and add optional notes.
4. **Generating** — calm, animated loading state while Vendio "writes" the listing.
5. **Review** — generated listing rendered read-only by default; toggle Edit to tweak title, description, price, category, or condition.
6. **Posting** — animated progress with marketplace-specific status messages.
7. **Dashboard** — live listing card, status pills, marketplace list, activity timeline, and `View Listing` / `Create Another Listing` actions.

No login, no database, no payment system — everything is mocked client-side so the demo always works.

## Optional: real Facebook Marketplace automation

The repo also ships an experimental Playwright-based Facebook adapter and persistent browser profile under `.vendio/facebook-profile`. To try it:

```bash
npx playwright install chromium
export OPENAI_API_KEY="..."   # optional, enables real description generation
```

Hit `/api/facebook/connect`, `/api/generate-listing`, or `/api/post-listing` directly. The default UI does not call these endpoints — it runs entirely on the client so the demo stays smooth and predictable.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Project layout

```
app/                Next.js App Router (page + API routes)
components/         Shared UI primitives (Navbar, Stepper, Icons)
components/steps/   The 7 step screens in the main flow
lib/                Server-side helpers + client mock listing generator
types/              Shared TypeScript types (app state + listing model)
```
