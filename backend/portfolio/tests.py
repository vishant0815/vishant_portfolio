from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Profile, Project, Skill, split_lines


class SplitLinesTests(TestCase):
    def test_strips_bullets_and_blank_lines(self):
        self.assertEqual(split_lines("- one\n\n• two\n* three  \n"), ["one", "two", "three"])


@override_settings(API_CACHE_SECONDS=0)
class PortfolioApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_portfolio", verbosity=0)

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_seed_is_idempotent(self):
        before = (Skill.objects.count(), Project.objects.count())
        call_command("seed_portfolio", verbosity=0)
        self.assertEqual((Skill.objects.count(), Project.objects.count()), before)
        self.assertEqual(Profile.objects.count(), 1)

    def test_portfolio_endpoint_returns_every_section(self):
        response = self.client.get(reverse("portfolio"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for key in ["profile", "stats", "skill_categories", "experience", "projects", "education", "certifications"]:
            self.assertIn(key, data)
        self.assertEqual(data["profile"]["short_name"], "Vishant")
        self.assertIsInstance(data["experience"][0]["highlights"], list)

    def test_hidden_projects_are_not_public(self):
        hidden = Project.objects.get(slug="hrms-portal")
        self.assertFalse(hidden.is_visible)
        slugs = [p["slug"] for p in self.client.get(reverse("portfolio")).json()["projects"]]
        self.assertNotIn("hrms-portal", slugs)
        detail = self.client.get(reverse("project-detail", kwargs={"slug": "hrms-portal"}))
        self.assertEqual(detail.status_code, 404)

    def test_hidden_skills_are_not_public(self):
        Skill.objects.filter(name="Jenkins").update(is_visible=False)
        data = self.client.get(reverse("portfolio")).json()
        names = {s["name"] for c in data["skill_categories"] for s in c["skills"]}
        self.assertNotIn("Jenkins", names)
        self.assertIn("Docker", names)

    def test_project_detail_by_slug(self):
        response = self.client.get(reverse("project-detail", kwargs={"slug": "big-data-email-classification"}))
        self.assertEqual(response.status_code, 200)
        self.assertIn("PySpark", response.json()["skills"])

    def test_api_is_read_only(self):
        response = self.client.post(reverse("project-list"), {"title": "x"}, format="json")
        self.assertEqual(response.status_code, 405)

    def test_health_check(self):
        response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["database"], "ok")

    def test_phone_number_is_never_exposed(self):
        body = self.client.get(reverse("portfolio")).content.decode()
        self.assertNotIn("7900", body)
