"""
Contact form messages.

The FastAPI analytics service owns this table and its migrations (Alembic);
Django only reads it so messages show up in the same admin as everything else.
managed = False means Django will never create, alter or drop the table.
"""

from django.db import models


class ContactMessage(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=254)
    message = models.TextField()
    created_at = models.DateTimeField()
    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = "analytics_contact_message"
        ordering = ["-created_at"]
        verbose_name = "message"

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"
