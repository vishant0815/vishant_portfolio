"""
Public, read-only API.

The frontend makes one request to /api/v1/portfolio/ to render the whole
dashboard; the per-resource endpoints exist for project detail pages and for
anyone exploring the API. Content is only ever written through the admin.
"""

from django.conf import settings
from django.db import connection
from django.db.models import Prefetch
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Certification, Education, Experience, Profile, Project, Skill, SkillCategory, Stat
from .serializers import (
    CertificationSerializer,
    EducationSerializer,
    ExperienceSerializer,
    ProfileSerializer,
    ProjectSerializer,
    SkillCategorySerializer,
    StatSerializer,
)


def cached():
    return cache_page(settings.API_CACHE_SECONDS)


visible_skills = Prefetch("skills", queryset=Skill.objects.filter(is_visible=True))


def projects_qs():
    return Project.objects.filter(is_visible=True).prefetch_related(visible_skills)


def experience_qs():
    return Experience.objects.filter(is_visible=True).prefetch_related(visible_skills)


def categories_qs():
    return SkillCategory.objects.filter(is_visible=True).prefetch_related("skills")


@method_decorator(cached(), name="get")
class PortfolioView(APIView):
    """Everything the homepage needs, in one response."""

    def get(self, request):
        profile = Profile.objects.first()
        return Response(
            {
                "profile": ProfileSerializer(profile).data if profile else None,
                "stats": StatSerializer(Stat.objects.filter(is_visible=True), many=True).data,
                "skill_categories": SkillCategorySerializer(categories_qs(), many=True).data,
                "experience": ExperienceSerializer(experience_qs(), many=True).data,
                "projects": ProjectSerializer(projects_qs(), many=True).data,
                "education": EducationSerializer(Education.objects.filter(is_visible=True), many=True).data,
                "certifications": CertificationSerializer(Certification.objects.filter(is_visible=True), many=True).data,
            }
        )


@method_decorator(cached(), name="list")
@method_decorator(cached(), name="retrieve")
class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProjectSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return projects_qs()


@method_decorator(cached(), name="list")
class ExperienceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExperienceSerializer

    def get_queryset(self):
        return experience_qs()


@method_decorator(cached(), name="list")
class SkillCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SkillCategorySerializer
    lookup_field = "slug"

    def get_queryset(self):
        return categories_qs()


class HealthView(APIView):
    """Used by Docker and the AWS load balancer to check the service is up."""

    throttle_classes: list = []

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            database = "ok"
        except Exception:
            database = "unavailable"
        status_code = 200 if database == "ok" else 503
        return Response({"status": "ok" if status_code == 200 else "degraded", "database": database}, status=status_code)
