"""
Catches email addresses that can't be real, before a contact message is accepted:

1. Typos in common providers ("gmial.com")      -> error with a "Did you mean ...?" suggestion
2. Throwaway inboxes ("mailinator.com")         -> error (open-source list of ~10,000 domains)
3. Domains that can't receive email at all      -> error (DNS: no MX record and no A/AAAA record)

What this cannot do: tell whether a mailbox exists on a real provider
(randomname123@gmail.com). Providers deliberately hide that to stop address harvesting.

DNS problems never block a real person: unless the resolver can return the mail servers
of a known-good domain, the DNS step is skipped ("fail open") and the other checks still run.
"""

import asyncio
import time
from dataclasses import dataclass

import dns.exception
import dns.resolver
from disposable_email_domains import blocklist as DISPOSABLE_DOMAINS

from .config import get_settings

# Misspellings of the biggest providers. Some typo domains are registered by squatters,
# so a DNS check alone would let them through.
TYPO_DOMAINS = {
    "gmial.com": "gmail.com", "gmal.com": "gmail.com", "gmaill.com": "gmail.com", "gamil.com": "gmail.com",
    "gnail.com": "gmail.com", "gmai.com": "gmail.com", "gmali.com": "gmail.com", "gmail.co": "gmail.com",
    "gmail.cm": "gmail.com", "gmail.om": "gmail.com", "gmailcom": "gmail.com",
    "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmai.com": "hotmail.com",
    "homail.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmil.com": "hotmail.com",
    "outlok.com": "outlook.com", "outloo.com": "outlook.com", "outlook.co": "outlook.com", "otulook.com": "outlook.com",
    "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yhaoo.com": "yahoo.com", "yahoo.cm": "yahoo.com",
    "iclod.com": "icloud.com", "icoud.com": "icloud.com", "icloud.co": "icloud.com",
}
TYPO_ENDINGS = {".con": ".com", ".cmo": ".com", ".comm": ".com", ".co.ukk": ".co.uk", ".ocm": ".com"}

KNOWN_GOOD_DOMAIN = "gmail.com"  # used to tell "this domain has no mail" from "DNS isn't working"
DNS_HEALTH_SECONDS = 600
DOMAIN_CACHE_SECONDS = 86_400
DOMAIN_CACHE_MAX = 5_000


@dataclass(frozen=True)
class EmailCheck:
    valid: bool
    message: str = ""
    suggestion: str = ""


def _suggest_domain(domain: str) -> str | None:
    if domain in TYPO_DOMAINS:
        return TYPO_DOMAINS[domain]
    for wrong, right in TYPO_ENDINGS.items():
        if domain.endswith(wrong):
            return domain[: -len(wrong)] + right
    return None


def _is_disposable(domain: str) -> bool:
    # Also catches subdomains such as "inbox.mailinator.com".
    parts = domain.split(".")
    return any(".".join(parts[i:]) in DISPOSABLE_DOMAINS for i in range(len(parts) - 1))


def _lookup_accepts_mail(domain: str) -> bool | None:
    """True = can receive mail, False = definitely can't, None = couldn't find out."""
    resolver = dns.resolver.Resolver()
    resolver.lifetime = get_settings().email_dns_timeout
    try:
        answers = resolver.resolve(domain, "MX")
        # A single "." MX record (RFC 7505) means the domain explicitly accepts no email.
        return not all(str(record.exchange) == "." for record in answers)
    except dns.resolver.NXDOMAIN:
        return False
    except dns.resolver.NoAnswer:
        pass  # no MX: mail falls back to the domain's own address records
    except (dns.exception.Timeout, dns.resolver.NoNameservers, dns.exception.DNSException):
        return None
    for record_type in ("A", "AAAA"):
        try:
            resolver.resolve(domain, record_type)
            return True
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
            continue
        except dns.exception.DNSException:
            return None
    return False


def _mx_lookups_work() -> bool:
    """Some networks filter MX lookups and answer "no records" for every domain. Only trust
    DNS when a domain that certainly has mail servers returns them."""
    resolver = dns.resolver.Resolver()
    resolver.lifetime = get_settings().email_dns_timeout
    try:
        return any(str(record.exchange) != "." for record in resolver.resolve(KNOWN_GOOD_DOMAIN, "MX"))
    except dns.exception.DNSException:
        return False


class DomainChecker:
    """Caches DNS answers per domain and keeps track of whether DNS itself is usable."""

    def __init__(self) -> None:
        self._domains: dict[str, tuple[float, bool | None]] = {}
        self._dns_ok: tuple[float, bool] | None = None

    def reset(self) -> None:
        self._domains.clear()
        self._dns_ok = None

    async def _dns_working(self) -> bool:
        now = time.monotonic()
        if self._dns_ok and now - self._dns_ok[0] < DNS_HEALTH_SECONDS:
            return self._dns_ok[1]
        working = await asyncio.to_thread(_mx_lookups_work)
        self._dns_ok = (now, working)
        return working

    async def accepts_mail(self, domain: str) -> bool | None:
        now = time.monotonic()
        cached = self._domains.get(domain)
        if cached and now - cached[0] < DOMAIN_CACHE_SECONDS:
            return cached[1]
        if not await self._dns_working():
            return None
        result = await asyncio.to_thread(_lookup_accepts_mail, domain)
        if result is not None:
            if len(self._domains) >= DOMAIN_CACHE_MAX:
                self._domains.clear()
            self._domains[domain] = (now, result)
        return result


domain_checker = DomainChecker()


async def check_email(address: str) -> EmailCheck:
    """Assumes the address has already passed format validation (Pydantic EmailStr)."""
    local, _, domain = address.strip().rpartition("@")
    domain = domain.lower().rstrip(".")

    suggestion = _suggest_domain(domain)
    if suggestion:
        return EmailCheck(False, f"Check the spelling of {domain}.", f"{local}@{suggestion}")

    if _is_disposable(domain):
        return EmailCheck(False, "Use a permanent email address. Temporary inboxes can't receive my reply.")

    if get_settings().email_dns_check and await domain_checker.accepts_mail(domain) is False:
        return EmailCheck(False, f"{domain} can't receive email. Check the address for typos.")

    return EmailCheck(True)
