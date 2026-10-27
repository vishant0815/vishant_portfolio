from datetime import date

from pydantic import BaseModel, EmailStr, Field, field_validator


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    message: str = Field(min_length=10, max_length=5000)
    # Honeypot: hidden in the form, so only bots fill it in.
    website: str = Field(default="", max_length=200)

    @field_validator("name", "message")
    @classmethod
    def strip(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("can't be blank")
        return value


class EmailCheckIn(BaseModel):
    email: EmailStr


class EmailCheckOut(BaseModel):
    valid: bool
    message: str = ""
    suggestion: str = ""


class AcceptedOut(BaseModel):
    status: str = "received"


class PageViewIn(BaseModel):
    path: str = Field(min_length=1, max_length=300, pattern=r"^/[^\s]*$")
    referrer: str = Field(default="", max_length=2000)


class DailyPoint(BaseModel):
    date: date
    views: int
    visitors: int


class TopPage(BaseModel):
    path: str
    views: int


class StatsOut(BaseModel):
    window_days: int
    views_total: int
    views_window: int
    visitors_window: int
    daily: list[DailyPoint]
    top_pages: list[TopPage]
    top_referrers: list[TopPage]
