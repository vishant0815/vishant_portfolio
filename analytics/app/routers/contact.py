from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db import get_session
from ..email_check import check_email
from ..models import ContactMessage
from ..notify import notify_new_message
from ..privacy import visitor_hash
from ..ratelimit import limiter
from ..schemas import AcceptedOut, ContactIn, EmailCheckIn, EmailCheckOut

router = APIRouter(tags=["contact"])


@router.post("/contact/check-email", response_model=EmailCheckOut, response_model_exclude_defaults=True)
async def check_contact_email(payload: EmailCheckIn, request: Request):
    """Instant check used by the form when the visitor leaves the email field."""
    limiter.check("email-check", visitor_hash(request), get_settings().email_check_rate_limit, 60)
    result = await check_email(str(payload.email))
    return EmailCheckOut(valid=result.valid, message=result.message, suggestion=result.suggestion)


@router.post("/contact", status_code=status.HTTP_202_ACCEPTED, response_model=AcceptedOut)
async def submit_contact(payload: ContactIn, request: Request, session: AsyncSession = Depends(get_session)):
    settings = get_settings()
    limiter.check("contact", visitor_hash(request), settings.contact_rate_limit, 3600)

    # Bots that fill the honeypot get the same response, so they can't tell they were caught.
    if payload.website:
        return AcceptedOut()

    # The same fake-email checks run again here: the browser check can be skipped by anyone.
    result = await check_email(str(payload.email))
    if not result.valid:
        error = {"loc": ["body", "email"], "msg": result.message, "type": "email_undeliverable"}
        if result.suggestion:
            error["suggestion"] = result.suggestion
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, content={"detail": [error]})

    message = ContactMessage(name=payload.name, email=str(payload.email), message=payload.message)
    session.add(message)
    await session.commit()

    if await notify_new_message(message.name, message.email, message.message):
        message.email_sent = True
        await session.commit()

    return AcceptedOut()
