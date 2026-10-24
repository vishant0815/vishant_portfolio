# Frontend

Next.js 16 (App Router, JavaScript), Tailwind CSS 4, Motion for animation and Recharts for charts.
All content comes from the Django content API and the FastAPI analytics service.

## Run locally

Start the backends first (`docker compose up` from the repo root), then:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## How data flows

- `src/lib/api.js` fetches content on the server. Content is cached with `use cache`
  and refreshed every minute, so edits in the Django admin show up without a redeploy.
- The homepage's live trace runs on every request (`connection()` inside `<Suspense>`),
  timing real calls to both APIs. Next.js serves the cached page instantly and streams
  the trace in (Partial Prerendering).
- If an API is down, cached content keeps the site up and the trace shows which service failed.

## Theme

Dark by default with a light theme toggle. A small inline script sets the theme before the
first paint, so there's no flash, and the choice is saved in `localStorage`. The switch uses
the View Transitions API for a circular reveal, and is instant when "reduce motion" is on.

## Checks

```bash
npm run lint
npm run build
```
