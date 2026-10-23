"""Settings, read from environment variables (see ../../.env.example)."""

from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ANALYTICS_", env_file=None, extra="ignore")

    # postgresql+asyncpg://user:pass@host:5432/db  (sqlite+aiosqlite:// in tests)
    database_url: str = "sqlite+aiosqlite:///./analytics.db"

    # Derives the daily salt for anonymous visitor IDs. Required, no default: the service
    # refuses to start without it rather than quietly running with a guessable key.
    secret_key: str = Field(min_length=16)

    # Comma-separated in the environment, e.g. "https://vishant.dev,https://www.vishant.dev"
    cors_allowed_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    # Only trust X-Forwarded-For when running behind our own load balancer / reverse proxy.
    trust_proxy_headers: bool = False

    contact_rate_limit: int = 5          # messages per visitor per hour
    events_rate_limit: int = 60          # page views per visitor per minute
    stats_cache_seconds: int = 60
    stats_window_days: int = 30

    # Optional email notifications through Amazon SES. Leave blank to only store messages.
    contact_notify_email: str = ""
    ses_from_email: str = ""
    aws_region: str = "eu-west-2"

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def email_enabled(self) -> bool:
        return bool(self.contact_notify_email and self.ses_from_email)


@lru_cache
def get_settings() -> Settings:
    return Settings()
