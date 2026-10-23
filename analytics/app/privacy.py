"""Anonymous visitor identification and client IP handling."""

import hashlib
import hmac
from datetime import date, datetime, timezone

from fastapi import Request

from .config import get_settings

BOT_MARKERS = ("bot", "crawl", "spider", "slurp", "headless", "lighthouse", "preview")


def client_ip(request: Request) -> str:
    if get_settings().trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def daily_salt(day: date | None = None) -> bytes:
    day = day or datetime.now(timezone.utc).date()
    return hmac.new(get_settings().secret_key.encode(), day.isoformat().encode(), hashlib.sha256).digest()


def visitor_hash(request: Request, day: date | None = None) -> str:
    """One-way, daily-rotating ID. The raw IP and user agent are never stored."""
    user_agent = request.headers.get("user-agent", "")
    raw = f"{client_ip(request)}|{user_agent}".encode()
    return hmac.new(daily_salt(day), raw, hashlib.sha256).hexdigest()


def is_bot(request: Request) -> bool:
    user_agent = request.headers.get("user-agent", "").lower()
    return not user_agent or any(marker in user_agent for marker in BOT_MARKERS)
