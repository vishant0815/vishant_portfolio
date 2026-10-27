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

## Analytics and the /live page

- `PageViewTracker` (in the root layout) sends one anonymous page view per page to the FastAPI
  analytics service at `NEXT_PUBLIC_ANALYTICS_URL`. It uses no cookies or storage, sends the
  referring site only for the landing page, and does nothing for visitors with Do Not Track or
  Global Privacy Control switched on. The service itself ignores bots.
- `/live` renders the latest stats on the server, then refreshes them in the browser every
  30 seconds while the tab is visible. If the service stops responding, it keeps the last numbers
  and shows that it's retrying.

## Contact form

`/contact` posts to the FastAPI service's `POST /api/v1/contact`. The form checks the same rules
as the API before sending (name, valid email, 10 to 5,000 characters), shows errors next to each
field, and handles the API's validation errors and its 5-per-hour limit. A hidden honeypot field
catches bots. Messages appear in the Django admin under Inbox.

The email is checked as soon as the visitor leaves the field: first its format in the browser,
then `POST /api/v1/contact/check-email` for typos (with a one-click "Did you mean ...?" fix),
throwaway inboxes and domains that can't receive mail. A spinner shows while checking and a tick
once the address passes. If the check can't run, the form still works; the server checks again
on send.

## Theme

Dark by default with a light theme toggle. A small inline script sets the theme before the
first paint, so there's no flash, and the choice is saved in `localStorage`. The switch uses
the View Transitions API for a circular reveal, and is instant when "reduce motion" is on.

## Checks

```bash
npm run lint
npm run build
```
