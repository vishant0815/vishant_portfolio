from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import ContactMessage


class InboxAdminTests(TestCase):
    """The table belongs to the FastAPI service, so the test creates it itself."""

    @classmethod
    def setUpClass(cls):
        # Created before the class-level transaction opens (SQLite can't alter schema inside one).
        with connection.schema_editor() as editor:
            editor.create_model(ContactMessage)
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        with connection.schema_editor() as editor:
            editor.delete_model(ContactMessage)

    def setUp(self):
        admin = get_user_model().objects.create_superuser("owner", "owner@example.com", "a-long-test-password")
        self.client.force_login(admin)
        self.message = ContactMessage.objects.create(
            name="Recruiter", email="recruiter@example.com", message="Are you free for a chat?", created_at=timezone.now()
        )

    def test_inbox_lists_messages(self):
        response = self.client.get(reverse("admin:inbox_contactmessage_changelist"))
        self.assertContains(response, "Recruiter")
        self.assertContains(response, "New")

    def test_opening_a_message_marks_it_read(self):
        self.client.get(reverse("admin:inbox_contactmessage_change", args=[self.message.pk]))
        self.message.refresh_from_db()
        self.assertTrue(self.message.is_read)

    def test_messages_cannot_be_added_in_admin(self):
        response = self.client.get(reverse("admin:inbox_contactmessage_add"))
        self.assertEqual(response.status_code, 403)
