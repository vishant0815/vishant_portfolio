# Vishant Bhavsar — portfolio

A data-dashboard style portfolio whose content is managed from a backend rather than hard-coded.
Edit a project, a skill or a headline number in the admin panel and the site updates straight away.

## Architecture

```
            ┌──────────────────────┐
 Browser ──▶│  Next.js frontend    │  AWS Amplify            (step 3)
            └──────────┬───────────┘
                       │ JSON over HTTPS
       ┌───────────────┴────────────────┐
       ▼                                ▼
┌──────────────────┐          ┌──────────────────────┐
│ Django + DRF     │          │ FastAPI service      │  (step 2)
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
| Contact and analytics service | FastAPI | Step 2 |
| Frontend | Next.js, React, Tailwind CSS, animations | Step 3 |
| Deployment | AWS Amplify, EC2, RDS, GitHub Actions with OIDC | Step 4 |

## Run it locally

You need Docker Desktop.

```bash
cp .env.example .env
docker compose up --build
```

The first start creates the database tables and loads the starting content from the CV.

- API: http://localhost:8000/api/v1/portfolio/
- Health check: http://localhost:8000/api/v1/health/
- Admin panel: http://localhost:8000/admin/

Create your admin login once:

```bash
docker compose exec backend python manage.py createsuperuser
```

## Managing content

Everything on the site is edited in the admin panel: profile, headline stats, skills (grouped by
category, with optional 1–5 ratings), experience, projects, education and certifications.

- **Order** controls the display order (lower shows first) and **Visible** hides an item without deleting it.
- Bullet-point fields take one point per line.
- Saving anything clears the API cache, so changes appear immediately.

To reload the CV content: `docker compose exec backend python manage.py seed_portfolio`
(add `--reset` to wipe everything first).

## API

All endpoints are public, read-only (`GET` only), cached and rate limited.

| Endpoint | Returns |
|---|---|
| `GET /api/v1/portfolio/` | Everything the homepage needs, in one response |
| `GET /api/v1/projects/` and `/api/v1/projects/<slug>/` | Visible projects |
| `GET /api/v1/experience/` | Work history |
| `GET /api/v1/skills/` | Skills grouped by category |
| `GET /api/v1/health/` | Service and database status, for Docker and the load balancer |

## Security

- Settings come from environment variables; no secrets are committed (`.env` is git-ignored).
- The app refuses to start in production mode without `DJANGO_SECRET_KEY`.
- Production mode enables HTTPS redirects, HSTS, secure cookies and clickjacking protection.
- The admin path is configurable (`DJANGO_ADMIN_URL`) so it isn't at the obvious `/admin/`.
- CORS allows only the frontend's own origins, and the API accepts only `GET`.
- The container runs as an unprivileged user and has a built-in health check.

## Tests

```bash
docker compose exec backend python manage.py test
```
