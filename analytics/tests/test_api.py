import asyncio
from datetime import date

from sqlalchemy import select
from starlette.requests import Request

from app.db import get_engine
from app.models import ContactMessage, PageView
from app.privacy import visitor_hash
from app.routers.events import referrer_host

VALID_MESSAGE = {"name": "Recruiter", "email": "recruiter@example.com", "message": "Hello, are you free for a chat?"}


def rows(model):
    async def fetch():
        async with get_engine().connect() as conn:
            return (await conn.execute(select(model))).all()

    return asyncio.run(fetch())


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_contact_is_saved(client):
    response = client.post("/api/v1/contact", json=VALID_MESSAGE)
    assert response.status_code == 202
    saved = rows(ContactMessage)
    assert len(saved) == 1
    assert saved[0].email == "recruiter@example.com"
    assert saved[0].email_sent is False  # email is off unless SES is configured


def test_contact_validation(client):
    bad = {**VALID_MESSAGE, "email": "not-an-email", "message": "short"}
    response = client.post("/api/v1/contact", json=bad)
    assert response.status_code == 422
    assert rows(ContactMessage) == []


def test_contact_rejects_blank_name(client):
    response = client.post("/api/v1/contact", json={**VALID_MESSAGE, "name": "   "})
    assert response.status_code == 422


def test_honeypot_is_silently_dropped(client):
    response = client.post("/api/v1/contact", json={**VALID_MESSAGE, "website": "http://spam.example"})
    assert response.status_code == 202
    assert rows(ContactMessage) == []


def test_contact_rate_limit(client):
    for _ in range(5):
        assert client.post("/api/v1/contact", json=VALID_MESSAGE).status_code == 202
    blocked = client.post("/api/v1/contact", json=VALID_MESSAGE)
    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers


def test_pageview_stores_no_personal_data(client):
    response = client.post(
        "/api/v1/events/pageview",
        json={"path": "/projects?email=me@example.com#top", "referrer": "https://www.linkedin.com/feed/?x=1"},
    )
    assert response.status_code == 204
    [view] = rows(PageView)
    assert view.path == "/projects"
    assert view.referrer_host == "linkedin.com"
    assert len(view.visitor_hash) == 64
    assert "testclient" not in view.visitor_hash


def test_bots_are_not_counted(client):
    client.post("/api/v1/events/pageview", json={"path": "/"}, headers={"user-agent": "Googlebot/2.1"})
    assert rows(PageView) == []


def test_invalid_path_rejected(client):
    assert client.post("/api/v1/events/pageview", json={"path": "not-a-path"}).status_code == 422


def test_stats(client):
    for path in ["/", "/", "/projects"]:
        client.post("/api/v1/events/pageview", json={"path": path, "referrer": "https://github.com/x"})
    client.post("/api/v1/events/pageview", json={"path": "/"}, headers={"user-agent": "Mozilla/5.0 Firefox/131.0"})

    stats = client.get("/api/v1/stats").json()
    assert stats["views_total"] == 4
    assert stats["views_window"] == 4
    assert stats["visitors_window"] == 2
    assert len(stats["daily"]) == stats["window_days"] == 30
    assert stats["daily"][-1] == {"date": date.today().isoformat(), "views": 4, "visitors": 2}
    assert stats["top_pages"][0] == {"path": "/", "views": 3}
    assert stats["top_referrers"] == [{"path": "github.com", "views": 3}]


def test_cors_only_allows_frontend(client):
    allowed = client.options(
        "/api/v1/contact",
        headers={"origin": "http://localhost:3000", "access-control-request-method": "POST"},
    )
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"
    blocked = client.options(
        "/api/v1/contact",
        headers={"origin": "https://evil.example", "access-control-request-method": "POST"},
    )
    assert "access-control-allow-origin" not in blocked.headers


def _request(ip: str, agent: str) -> Request:
    return Request({"type": "http", "headers": [(b"user-agent", agent.encode())], "client": (ip, 1234)})


def test_visitor_hash_rotates_daily():
    req = _request("203.0.113.7", "Mozilla/5.0")
    assert visitor_hash(req, date(2026, 1, 1)) == visitor_hash(req, date(2026, 1, 1))
    assert visitor_hash(req, date(2026, 1, 1)) != visitor_hash(req, date(2026, 1, 2))
    assert "203.0.113.7" not in visitor_hash(req, date(2026, 1, 1))


def test_own_site_is_not_a_referrer():
    assert referrer_host("https://vishant.dev/about", "vishant.dev") == ""
    assert referrer_host("", "vishant.dev") == ""


def test_cors_origins_parse_from_comma_separated_env(monkeypatch):
    from app.config import Settings

    monkeypatch.setenv("ANALYTICS_CORS_ALLOWED_ORIGINS", "http://localhost:3000, https://vishant.dev")
    assert Settings().cors_allowed_origins == ["http://localhost:3000", "https://vishant.dev"]
