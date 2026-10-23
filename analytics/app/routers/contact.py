from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db import get_session
from ..models import ContactMessage
from ..notify import notify_new_message
from ..privacy import visitor_hash
from ..ratelimit import limiter
from ..schemas import AcceptedOut, ContactIn

router = APIRouter(tags=["contact"])


@router.post("/contact", status_code=status.HTTP_202_ACCEPTED, response_model=AcceptedOut)
async def submit_contact(payload: ContactIn, request: Request, session: AsyncSession = Depends(get_session)):
    settings = get_settings()
    limiter.check("contact", visitor_hash(request), settings.contact_rate_limit, 3600)

    # Bots that fill the honeypot get the same response, so they can't tell they were caught.
    if payload.website:
        return AcceptedOut()

    message = ContactMessage(name=payload.name, email=str(payload.email), message=payload.message)
    session.add(message)
    await session.commit()

    if await notify_new_message(message.name, message.email, message.message):
        message.email_sent = True
        await session.commit()

    return AcceptedOut()
