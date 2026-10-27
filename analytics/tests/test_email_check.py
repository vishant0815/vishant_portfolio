"""Fake-email checks. DNS answers are simulated, so these tests never use the network."""

import pytest

from app import email_check
from app.config import get_settings

FORM = {"name": "Recruiter", "message": "Hello, are you free for a chat this week?"}

# Simulated DNS: which domains can receive mail. Anything not listed "doesn't exist".
FAKE_DNS = {"gmail.com": True, "company.co.uk": True, "example.com": False}


@pytest.fixture()
def fake_dns(monkeypatch):
    calls = []

    def lookup(domain):
        calls.append(domain)
        return FAKE_DNS.get(domain, False)

    monkeypatch.setenv("ANALYTICS_EMAIL_DNS_CHECK", "true")
    get_settings.cache_clear()
    monkeypatch.setattr(email_check, "_lookup_accepts_mail", lookup)
    monkeypatch.setattr(email_check, "_mx_lookups_work", lambda: True)
    return calls


def check(client, email):
    response = client.post("/api/v1/contact/check-email", json={"email": email})
    assert response.status_code == 200
    return response.json()


def test_real_address_passes(client, fake_dns):
    assert check(client, "alex@gmail.com") == {"valid": True}
    assert check(client, "a.person@company.co.uk") == {"valid": True}


def test_typo_gets_a_suggestion(client):
    result = check(client, "alex@gmial.com")
    assert result["valid"] is False
    assert result["suggestion"] == "alex@gmail.com"
    assert check(client, "alex@outlook.con")["suggestion"] == "alex@outlook.com"


def test_throwaway_inboxes_are_rejected(client):
    for address in ["x@mailinator.com", "x@yopmail.com", "x@10minutemail.com", "x@inbox.mailinator.com"]:
        result = check(client, address)
        assert result["valid"] is False, address
        assert "permanent email" in result["message"]


def test_domain_without_mail_is_rejected(client, fake_dns):
    result = check(client, "someone@qwerty123abc.com")
    assert result == {"valid": False, "message": "qwerty123abc.com can't receive email. Check the address for typos."}


def test_dns_outage_never_blocks_real_people(client, fake_dns, monkeypatch):
    # A lookup that times out is "unknown", never "fake".
    monkeypatch.setattr(email_check, "_lookup_accepts_mail", lambda domain: None)
    assert check(client, "someone@qwerty123abc.com") == {"valid": True}


def test_filtered_mx_lookups_skip_the_dns_step(client, fake_dns, monkeypatch):
    # Some networks answer "no MX records" for every domain. gmail.com having none reveals that,
    # so the DNS step is skipped rather than rejecting real people.
    monkeypatch.setattr(email_check, "_mx_lookups_work", lambda: False)
    assert check(client, "someone@qwerty123abc.com") == {"valid": True}
    assert fake_dns == []
    # Typo and throwaway checks don't need DNS, so they still apply.
    assert check(client, "x@mailinator.com")["valid"] is False


def test_domain_answers_are_cached(client, fake_dns):
    check(client, "a@company.co.uk")
    check(client, "b@company.co.uk")
    assert fake_dns.count("company.co.uk") == 1


def test_contact_rejects_fake_domain_and_saves_nothing(client, fake_dns):
    response = client.post("/api/v1/contact", json={**FORM, "email": "someone@qwerty123abc.com"})
    assert response.status_code == 422
    [error] = response.json()["detail"]
    assert error["loc"] == ["body", "email"] and error["type"] == "email_undeliverable"


def test_contact_rejects_typo_with_suggestion(client):
    response = client.post("/api/v1/contact", json={**FORM, "email": "alex@gmial.com"})
    assert response.status_code == 422
    assert response.json()["detail"][0]["suggestion"] == "alex@gmail.com"


def test_contact_accepts_real_address(client, fake_dns):
    response = client.post("/api/v1/contact", json={**FORM, "email": "alex@gmail.com"})
    assert response.status_code == 202


def test_bad_format_is_rejected_before_any_lookup(client, fake_dns):
    response = client.post("/api/v1/contact/check-email", json={"email": "not-an-email"})
    assert response.status_code == 422
    assert fake_dns == []


def test_instant_check_is_rate_limited(client, monkeypatch):
    monkeypatch.setenv("ANALYTICS_EMAIL_CHECK_RATE_LIMIT", "3")
    get_settings.cache_clear()
    for _ in range(3):
        assert client.post("/api/v1/contact/check-email", json={"email": "a@gmail.com"}).status_code == 200
    assert client.post("/api/v1/contact/check-email", json={"email": "a@gmail.com"}).status_code == 429


class _Record:
    def __init__(self, exchange):
        self.exchange = exchange


def _fake_resolver(monkeypatch, answers):
    """answers: {(domain, record_type): list of records | exception class}"""
    import dns.resolver

    def resolve(self, domain, record_type):
        result = answers.get((domain, record_type), dns.resolver.NoAnswer)
        if isinstance(result, type) and issubclass(result, Exception):
            raise result()
        return result

    monkeypatch.setattr(dns.resolver.Resolver, "resolve", resolve)


def test_lookup_reads_mx_records(monkeypatch):
    _fake_resolver(monkeypatch, {("mail.test", "MX"): [_Record("mx1.mail.test.")]})
    assert email_check._lookup_accepts_mail("mail.test") is True


def test_lookup_null_mx_means_no_mail(monkeypatch):
    _fake_resolver(monkeypatch, {("nomail.test", "MX"): [_Record(".")]})
    assert email_check._lookup_accepts_mail("nomail.test") is False


def test_lookup_nonexistent_domain(monkeypatch):
    import dns.resolver

    _fake_resolver(monkeypatch, {("ghost.test", "MX"): dns.resolver.NXDOMAIN})
    assert email_check._lookup_accepts_mail("ghost.test") is False


def test_lookup_falls_back_to_address_records(monkeypatch):
    _fake_resolver(monkeypatch, {("web.test", "A"): ["192.0.2.1"]})
    assert email_check._lookup_accepts_mail("web.test") is True


def test_lookup_timeout_is_unknown(monkeypatch):
    import dns.exception

    _fake_resolver(monkeypatch, {("slow.test", "MX"): dns.exception.Timeout})
    assert email_check._lookup_accepts_mail("slow.test") is None


def test_mx_health_check(monkeypatch):
    _fake_resolver(monkeypatch, {("gmail.com", "MX"): [_Record("gmail-smtp-in.l.google.com.")]})
    assert email_check._mx_lookups_work() is True
    _fake_resolver(monkeypatch, {})  # every MX lookup answers "no records"
    assert email_check._mx_lookups_work() is False
