from django.contrib import admin
from django.core.cache import cache

from .models import Certification, Education, Experience, Profile, Project, Skill, SkillCategory, Stat


class ClearCacheOnSaveMixin:
    """Changes made in the admin show on the site straight away, not after the cache expires."""

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        cache.clear()

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        cache.clear()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        cache.clear()

    def delete_queryset(self, request, queryset):
        super().delete_queryset(request, queryset)
        cache.clear()


class OrderedAdmin(ClearCacheOnSaveMixin, admin.ModelAdmin):
    list_editable = ["order", "is_visible"]
    list_filter = ["is_visible"]


@admin.register(Profile)
class ProfileAdmin(ClearCacheOnSaveMixin, admin.ModelAdmin):
    list_display = ["full_name", "headline", "open_to_work", "updated_at"]
    fieldsets = [
        (None, {"fields": ["full_name", "short_name", "headline", "summary", "location"]}),
        ("Links", {"fields": ["email", "linkedin_url", "github_url", "cv_url"]}),
        ("Availability", {"fields": ["open_to_work", "availability_note"]}),
    ]

    def has_add_permission(self, request):
        return not Profile.objects.exists()


@admin.register(Stat)
class StatAdmin(OrderedAdmin):
    list_display = ["label", "value", "prefix", "suffix", "order", "is_visible"]


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 1
    fields = ["name", "level", "is_featured", "order", "is_visible"]


@admin.register(SkillCategory)
class SkillCategoryAdmin(OrderedAdmin):
    list_display = ["name", "skill_count", "order", "is_visible"]
    prepopulated_fields = {"slug": ["name"]}
    inlines = [SkillInline]

    @admin.display(description="Skills")
    def skill_count(self, obj):
        return obj.skills.count()


@admin.register(Skill)
class SkillAdmin(OrderedAdmin):
    list_display = ["name", "category", "level", "is_featured", "order", "is_visible"]
    list_editable = ["level", "is_featured", "order", "is_visible"]
    list_filter = ["category", "is_featured", "is_visible"]
    search_fields = ["name"]


@admin.register(Experience)
class ExperienceAdmin(OrderedAdmin):
    list_display = ["role", "company", "start_date", "end_date", "order", "is_visible"]
    filter_horizontal = ["skills"]
    search_fields = ["role", "company"]


@admin.register(Project)
class ProjectAdmin(OrderedAdmin):
    list_display = ["title", "is_featured", "order", "is_visible"]
    list_editable = ["is_featured", "order", "is_visible"]
    list_filter = ["is_featured", "is_visible"]
    prepopulated_fields = {"slug": ["title"]}
    filter_horizontal = ["skills"]
    search_fields = ["title", "tagline"]


@admin.register(Education)
class EducationAdmin(OrderedAdmin):
    list_display = ["qualification", "institution", "start_date", "end_date", "order", "is_visible"]


@admin.register(Certification)
class CertificationAdmin(OrderedAdmin):
    list_display = ["name", "issuer", "issued_on", "order", "is_visible"]
