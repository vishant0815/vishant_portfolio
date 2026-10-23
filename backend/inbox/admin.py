from django.contrib import admin
from django.utils.html import format_html
from django.utils.text import Truncator

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["status", "name", "email_link", "preview", "created_at"]
    list_display_links = ["name"]
    list_filter = ["is_read", "created_at"]
    search_fields = ["name", "email", "message"]
    readonly_fields = ["name", "email_link", "message", "created_at", "email_sent"]
    fields = ["name", "email_link", "created_at", "message", "is_read", "email_sent"]
    actions = ["mark_read", "mark_unread"]
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False  # messages only arrive through the website's contact form

    def change_view(self, request, object_id, form_url="", extra_context=None):
        ContactMessage.objects.filter(pk=object_id, is_read=False).update(is_read=True)
        return super().change_view(request, object_id, form_url, extra_context)

    @admin.display(description="", ordering="is_read")
    def status(self, obj):
        return "" if obj.is_read else format_html('<strong style="color:#378ADD">{}</strong>', "New")

    @admin.display(description="Email", ordering="email")
    def email_link(self, obj):
        return format_html('<a href="mailto:{}">{}</a>', obj.email, obj.email)

    @admin.display(description="Message")
    def preview(self, obj):
        return Truncator(obj.message).chars(80)

    @admin.action(description="Mark selected as read")
    def mark_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description="Mark selected as unread")
    def mark_unread(self, request, queryset):
        queryset.update(is_read=False)
