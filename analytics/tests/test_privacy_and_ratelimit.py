"""Unit tests for client IP handling, bot detection and the in-memory rate limiter."""

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app import ratelimit
from app.config import get_settings
from app.privacy import client_ip, is_bot
from app.ratelimit import RateLimiter

BROWSER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36"


def _request(headers: dict[str, str] | None = None, client: tuple[str, int] | None = ("198.51.100.4", 5000)) -> Request:
    raw_headers = [(name.lower().encode(), value.encode()) for name, value in (headers or {}).items()]
    return Request({"type": "http", "headers": raw_headers, "client": client})


@pytest.fixture()
def trust_proxy(monkeypatch):
    def _set(enabled: bool) -> None:
        monkeypatch.setenv("ANALYTICS_TRUST_PROXY_HEADERS", "true" if enabled else "false")
        get_settings.cache_clear()

    yield _set
    get_settings.cache_clear()


# --- client_ip -----------------------------------------------------------------------------


def test_client_ip_ignores_forwarded_header_by_default(trust_proxy):
    trust_proxy(False)
    req = _request({"x-forwarded-for": "203.0.113.9"})
    assert client_ip(req) == "198.51.100.4"


def test_client_ip_uses_first_forwarded_hop_behind_proxy(trust_proxy):
    trust_proxy(True)
    req = _request({"x-forwarded-for": " 203.0.113.9 , 10.0.0.2, 10.0.0.1"})
    assert client_ip(req) == "203.0.113.9"


def test_client_ip_falls_back_to_socket_when_header_missing(trust_proxy):
    trust_proxy(True)
    assert client_ip(_request()) == "198.51.100.4"


def test_client_ip_unknown_without_client(trust_proxy):
    trust_proxy(False)
    assert client_ip(_request(client=None)) == "unknown"


# --- is_bot --------------------------------------------------------------------------------


@pytest.mark.parametrize(
    "agent",
    [
        "",
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/130.0 Safari/537.36",
        "Mozilla/5.0 (compatible; Yahoo! Slurp)",
        "Chrome-Lighthouse",
    ],
)
def test_is_bot_flags_crawlers_and_empty_agents(agent):
    assert is_bot(_request({"user-agent": agent}))


def test_is_bot_flags_missing_user_agent():
    assert is_bot(_request())


def test_is_bot_allows_real_browsers():
    assert not is_bot(_request({"user-agent": BROWSER_AGENT}))


# --- RateLimiter ---------------------------------------------------------------------------


@pytest.fixture()
def clock(monkeypatch):
    """A controllable stand-in for time.monotonic inside the rate limiter."""

    class Clock:
        now = 1000.0

        def advance(self, seconds: float) -> None:
            self.now += seconds

    fake = Clock()
    monkeypatch.setattr(ratelimit.time, "monotonic", lambda: fake.now)
    return fake


def test_rate_limiter_blocks_after_limit(clock):
    limiter = RateLimiter()
    for _ in range(3):
        limiter.check("contact", "visitor-a", limit=3, window_seconds=60)

    with pytest.raises(HTTPException) as exc:
        limiter.check("contact", "visitor-a", limit=3, window_seconds=60)

    assert exc.value.status_code == 429
    assert exc.value.headers["Retry-After"] == "61"


def test_rate_limiter_retry_after_shrinks_as_time_passes(clock):
    limiter = RateLimiter()
    limiter.check("contact", "visitor-a", limit=1, window_seconds=60)
    clock.advance(45)

    with pytest.raises(HTTPException) as exc:
        limiter.check("contact", "visitor-a", limit=1, window_seconds=60)

    assert exc.value.headers["Retry-After"] == "16"


def test_rate_limiter_allows_again_after_window(clock):
    limiter = RateLimiter()
    limiter.check("contact", "visitor-a", limit=1, window_seconds=60)
    clock.advance(60)
    limiter.check("contact", "visitor-a", limit=1, window_seconds=60)


def test_rate_limiter_keeps_buckets_and_visitors_separate(clock):
    limiter = RateLimiter()
    limiter.check("contact", "visitor-a", limit=1, window_seconds=60)
    limiter.check("events", "visitor-a", limit=1, window_seconds=60)
    limiter.check("contact", "visitor-b", limit=1, window_seconds=60)


def test_rate_limiter_reset_clears_history(clock):
    limiter = RateLimiter()
    limiter.check("contact", "visitor-a", limit=1, window_seconds=60)
    limiter.reset()
    limiter.check("contact", "visitor-a", limit=1, window_seconds=60)
