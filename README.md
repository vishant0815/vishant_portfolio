# Vishant Bhavsar — portfolio

A data-dashboard style portfolio whose content is managed from a backend rather than hard-coded.
Edit a project, a skill or a headline number in the admin panel and the site updates straight away.

## Architecture

```
            ┌──────────────────────┐
 Browser ──▶│  Next.js frontend    │  AWS Amplify
            └──────────┬───────────┘
                       │ JSON over HTTPS
       ┌───────────────┴────────────────┐
       ▼                                ▼
┌──────────────────┐          ┌──────────────────────┐
│ Django + DRF     │          │ FastAPI service      │
│ content API and  │          │ contact form and     │
│ admin panel      │          │ visitor analytics    │
└────────┬─────────┘          └──────────┬───────────┘
         └──────────────┬────────────────┘
                        ▼
              ┌───────────────────┐
              │ PostgreSQL        │  Amazon RDS in production
              └───────────────────┘
```

Both backends run as Docker containers on AWS EC2. Locally, Docker Compose runs the same images
with a Postgres container in place of RDS.

| Part | Stack | Status |
|---|---|---|
| Content API and admin | Django 5.2 LTS, Django REST Framework, PostgreSQL | Done |
| Contact and analytics service | FastAPI, SQLAlchemy 2 (async), Alembic | Done |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Motion, Recharts | In progress |
| Deployment | AWS Amplify, EC2, RDS, GitHub Actions with OIDC | Step 4 |

## Run it locally

You need Docker Desktop.

```bash
cp .env.example .env
docker compose up --build
```

The first start creates the database tables and loads the starting content from the CV.

- Content API: http://localhost:8000/api/v1/portfolio/
- Analytics API: http://localhost:8001/api/v1/stats
- Analytics API docs (Swagger): http://localhost:8001/api/v1/docs
- Admin panel: http://localhost:8000/admin/

Then start the frontend (see `frontend/README.md`):

```bash
cd frontend && cp .env.example .env.local && npm install && npm run dev
```

Open http://localhost:3000.

Create your admin login once:

```bash
docker compose exec backend python manage.py createsuperuser
```

## Managing content

Everything on the site is edited in the admin panel: profile, headline stats, skills (grouped by
category, with optional 1–5 ratings), experience, projects, education and certifications.
Messages sent through the contact form appear under **Inbox**; opening one marks it as read.

- **Order** controls the display order (lower shows first) and **Visible** hides an item without deleting it.
- Bullet-point fields take one point per line.
- Saving anything clears the API cache, so changes appear immediately.

To reload the CV content: `docker compose exec backend python manage.py seed_portfolio`
(add `--reset` to wipe everything first).

## Content API (Django)

All endpoints are public, read-only (`GET` only), cached and rate limited.

| Endpoint | Returns |
|---|---|
| `GET /api/v1/portfolio/` | Everything the homepage needs, in one response |
| `GET /api/v1/projects/` and `/api/v1/projects/<slug>/` | Visible projects |
| `GET /api/v1/experience/` | Work history |
| `GET /api/v1/skills/` | Skills grouped by category |
| `GET /api/v1/health/` | Service and database status, for Docker and the load balancer |

## Analytics API (FastAPI)

| Endpoint | Does |
|---|---|
| `POST /api/v1/contact` | Saves a contact message (validated, fake-email checks, honeypot spam trap, 5 per visitor per hour) and optionally emails it through Amazon SES |
| `POST /api/v1/contact/check-email` | Instant check used by the form: catches typos in big providers ("Did you mean ...?"), throwaway inboxes and domains that can't receive email |
| `POST /api/v1/events/pageview` | Records an anonymous page view (bots ignored, 60 per visitor per minute) |
| `GET /api/v1/stats` | Views and visitors for the last 30 days, daily series, top pages and top referrers, for the live dashboard |
| `GET /api/v1/health` | Service and database status |

Interactive documentation is at `/api/v1/docs`.

### Fake-email checks

`app/email_check.py` rejects three kinds of address that can't be real:

- **Typos** in big providers (`gmial.com`, `outlook.con`), with a suggested correction.
- **Throwaway inboxes** (Mailinator, YOPmail and about 10,000 others), from the open-source
  `disposable-email-domains` list.
- **Domains that can't receive email**, by looking up the domain's MX (and A/AAAA) records.

It can't tell whether a mailbox exists at a real provider (`randomname@gmail.com`): providers
hide that to stop spammers. DNS trouble never blocks a real person: if a lookup times out, or
MX lookups are filtered on the network, the DNS step is skipped and the other checks still apply.

### Privacy

The analytics are built to need no cookie banner:

- No cookies, no IP addresses and no full user agents are stored.
- Each visitor gets a one-way hash of IP and browser, keyed with a secret that changes every day,
  so visits are counted but nobody can be followed from one day to the next.
- Query strings are dropped from paths (they can carry personal data), and only the referring
  site's domain is kept.

### How the two services share the database

Both services use the same Postgres database with separate tables. The FastAPI service owns the
`analytics_*` tables and their Alembic migrations (with its own `analytics_alembic_version` table);
Django reads the contact messages through an unmanaged model (`managed = False`), so it never
alters that table.

## Security

- Settings come from environment variables; no secrets are committed (`.env` is git-ignored).
- The app refuses to start in production mode without `DJANGO_SECRET_KEY`.
- Production mode enables HTTPS redirects, HSTS, secure cookies and clickjacking protection.
- The admin path is configurable (`DJANGO_ADMIN_URL`) so it isn't at the obvious `/admin/`.
- CORS allows only the frontend's own origins, and the API accepts only `GET`.
- Both containers run as an unprivileged user and have built-in health checks.
- The analytics service refuses to start without `ANALYTICS_SECRET_KEY`, and only trusts
  `X-Forwarded-For` when `ANALYTICS_TRUST_PROXY_HEADERS` is on (behind our own load balancer).

## Tests

```bash
# Django: 12 tests
docker compose exec backend python manage.py test

# FastAPI: 32 tests (run from analytics/)
pip install -r requirements-dev.txt
pytest
```
