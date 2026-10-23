from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db import get_session
from ..models import PageView
from ..privacy import is_bot, visitor_hash
from ..ratelimit import limiter
from ..schemas import PageViewIn

router = APIRouter(tags=["analytics"])


def referrer_host(referrer: str, own_host: str) -> str:
    host = (urlsplit(referrer).hostname or "").lower().removeprefix("www.")
    return "" if not host or host == own_host else host[:255]


@router.post("/events/pageview", status_code=status.HTTP_204_NO_CONTENT)
async def record_pageview(payload: PageViewIn, request: Request, session: AsyncSession = Depends(get_session)):
    if is_bot(request):
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    visitor = visitor_hash(request)
    limiter.check("events", visitor, get_settings().events_rate_limit, 60)

    origin_host = (urlsplit(request.headers.get("origin", "")).hostname or "").lower().removeprefix("www.")
    path = payload.path.split("?")[0].split("#")[0] or "/"  # never keep query strings: they can carry personal data
    session.add(PageView(path=path, referrer_host=referrer_host(payload.referrer, origin_host), visitor_hash=visitor))
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
