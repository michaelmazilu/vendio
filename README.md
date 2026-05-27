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
2. **Connect Marketplace** — open a persistent browser session for Kijiji and/or Facebook Marketplace.
3. **Upload Photos** — drag-and-drop up to 8 photos and add optional notes.
4. **Generating** — uploads photos to the server and drafts the listing (OpenAI when configured).
5. **Review** — generated listing rendered read-only by default; toggle Edit to tweak title, description, price, category, or condition.
6. **Posting** — animated progress with marketplace-specific status messages.
7. **Dashboard** — live listing card, status pills, marketplace list, activity timeline, and `View Listing` / `Create Another Listing` actions.

No login, no database, no payment system. Listing drafts and uploads are stored locally under `.vendio/`.

## Marketplace automation (Playwright)

Vendio uses Playwright with persistent browser profiles (`.vendio/facebook-profile`, `.vendio/kijiji-profile`) to fill marketplace forms on your machine. You log in manually in the opened browser; Vendio never stores credentials.

```bash
npx playwright install chromium
export OPENAI_API_KEY="..."   # optional, enables real description generation
```

Connect step calls `/api/facebook/connect` or `/api/kijiji/connect`. Posting calls `/api/post-listing` with `target: "facebook"` or `target: "kijiji"`.

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
