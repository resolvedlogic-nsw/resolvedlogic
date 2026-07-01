from django.urls import path

from . import views

urlpatterns = [
    path("", views.home_redirect, name="home_redirect"),
    path("<str:filename>", views.serve_page, name="serve_page"),
]
