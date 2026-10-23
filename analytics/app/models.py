"""
Database tables owned by this service.

Privacy by design: no IP addresses, full user agents or cookies are stored.
Visitors are counted with a one-way hash that changes every day, so the same
person can't be followed from one day to the next.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, String, Text, false, func
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ContactMessage(Base):
    # The Django admin reads this table too (backend/inbox), so keep the name in sync.
    __tablename__ = "analytics_contact_message"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(254))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, server_default=func.now(), index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())


class PageView(Base):
    __tablename__ = "analytics_page_view"
    __table_args__ = (Index("ix_page_view_created_path", "created_at", "path"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    path: Mapped[str] = mapped_column(String(300))
    referrer_host: Mapped[str] = mapped_column(String(255), default="", server_default="")
    visitor_hash: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, server_default=func.now(), index=True)
