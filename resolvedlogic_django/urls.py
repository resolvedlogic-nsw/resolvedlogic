from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("contract/", include("contracts.urls")),
    # Keep this last — it's a catch-all for *.html requests
    path("", include("pages.urls")),
]
