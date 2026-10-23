from django.conf import settings
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Portfolio admin"
admin.site.site_title = "Portfolio admin"
admin.site.index_title = "Manage your portfolio content"

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path("api/v1/", include("portfolio.urls")),
]
