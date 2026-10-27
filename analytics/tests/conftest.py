import asyncio
import os

import pytest

os.environ.setdefault("ANALYTICS_SECRET_KEY", "test-secret-key-0123456789")

from fastapi.testclient import TestClient  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.db import Base, dispose_engine, get_engine  # noqa: E402
from app.email_check import domain_checker  # noqa: E402
from app.ratelimit import limiter  # noqa: E402
from app.routers.stats import clear_stats_cache  # noqa: E402

BROWSER = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36"}


async def _reset_db() -> None:
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await dispose_engine()


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("ANALYTICS_DATABASE_URL", f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    monkeypatch.setenv("ANALYTICS_STATS_CACHE_SECONDS", "0")
    # Tests never touch real DNS; the DNS tests switch it on and simulate the answers.
    monkeypatch.setenv("ANALYTICS_EMAIL_DNS_CHECK", "false")
    get_settings.cache_clear()
    asyncio.run(_reset_db())
    limiter.reset()
    clear_stats_cache()
    domain_checker.reset()

    from app.main import create_app

    with TestClient(create_app(), headers=BROWSER) as test_client:
        yield test_client
    get_settings.cache_clear()
