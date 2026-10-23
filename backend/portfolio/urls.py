from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExperienceViewSet, HealthView, PortfolioView, ProjectViewSet, SkillCategoryViewSet

router = DefaultRouter(trailing_slash=True)
router.register("projects", ProjectViewSet, basename="project")
router.register("experience", ExperienceViewSet, basename="experience")
router.register("skills", SkillCategoryViewSet, basename="skill-category")

urlpatterns = [
    path("portfolio/", PortfolioView.as_view(), name="portfolio"),
    path("health/", HealthView.as_view(), name="health"),
    path("", include(router.urls)),
]
