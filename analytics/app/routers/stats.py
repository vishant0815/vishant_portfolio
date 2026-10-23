"""Public, aggregated visitor numbers for the live dashboard. Never returns per-visitor data."""

import time
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db import get_session
from ..models import PageView
from ..schemas import DailyPoint, StatsOut, TopPage

router = APIRouter(tags=["analytics"])

_cache: dict[str, tuple[float, StatsOut]] = {}


def clear_stats_cache() -> None:
    _cache.clear()


def _as_date(value) -> date:
    return value if isinstance(value, date) else date.fromisoformat(str(value)[:10])


async def build_stats(session: AsyncSession, window_days: int) -> StatsOut:
    today = datetime.now(timezone.utc).date()
    start_day = today - timedelta(days=window_days - 1)
    since = datetime.combine(start_day, datetime.min.time(), tzinfo=timezone.utc)
    in_window = PageView.created_at >= since
    day = func.date(PageView.created_at)

    views_total = await session.scalar(select(func.count(PageView.id))) or 0
    views_window = await session.scalar(select(func.count(PageView.id)).where(in_window)) or 0
    # Hashes rotate daily, so this counts unique visitors per day, summed over the window.
    visitors_window = await session.scalar(select(func.count(distinct(PageView.visitor_hash))).where(in_window)) or 0

    rows = await session.execute(
        select(day, func.count(PageView.id), func.count(distinct(PageView.visitor_hash))).where(in_window).group_by(day)
    )
    by_day = {_as_date(d): (views, visitors) for d, views, visitors in rows}
    daily = [
        DailyPoint(date=d, views=by_day.get(d, (0, 0))[0], visitors=by_day.get(d, (0, 0))[1])
        for d in (start_day + timedelta(days=i) for i in range(window_days))
    ]

    count = func.count(PageView.id).label("views")
    top_pages = await session.execute(
        select(PageView.path, count).where(in_window).group_by(PageView.path).order_by(count.desc()).limit(5)
    )
    top_referrers = await session.execute(
        select(PageView.referrer_host, count)
        .where(in_window, PageView.referrer_host != "")
        .group_by(PageView.referrer_host)
        .order_by(count.desc())
        .limit(5)
    )

    return StatsOut(
        window_days=window_days,
        views_total=views_total,
        views_window=views_window,
        visitors_window=visitors_window,
        daily=daily,
        top_pages=[TopPage(path=p, views=v) for p, v in top_pages],
        top_referrers=[TopPage(path=h, views=v) for h, v in top_referrers],
    )


@router.get("/stats", response_model=StatsOut)
async def get_stats(session: AsyncSession = Depends(get_session)):
    settings = get_settings()
    cached = _cache.get("stats")
    if cached and cached[0] > time.monotonic():
        return cached[1]
    stats = await build_stats(session, settings.stats_window_days)
    _cache["stats"] = (time.monotonic() + settings.stats_cache_seconds, stats)
    return stats
