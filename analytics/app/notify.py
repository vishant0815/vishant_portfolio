"""Optional email alert for new contact messages, sent through Amazon SES."""

import asyncio
import logging

from .config import get_settings

logger = logging.getLogger(__name__)


def _send_with_ses(name: str, email: str, message: str) -> None:
    import boto3  # imported lazily so the service starts fast when email is off

    settings = get_settings()
    client = boto3.client("ses", region_name=settings.aws_region)
    client.send_email(
        Source=settings.ses_from_email,
        Destination={"ToAddresses": [settings.contact_notify_email]},
        ReplyToAddresses=[email],
        Message={
            "Subject": {"Data": f"Portfolio message from {name}"},
            "Body": {"Text": {"Data": f"From: {name} <{email}>\n\n{message}"}},
        },
    )


async def notify_new_message(name: str, email: str, message: str) -> bool:
    """Returns True if the email was sent. Never raises: the message is already saved."""
    if not get_settings().email_enabled:
        return False
    try:
        await asyncio.to_thread(_send_with_ses, name, email, message)
        return True
    except Exception:
        logger.exception("Could not send contact notification email")
        return False
