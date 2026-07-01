from django.urls import path

from . import views

urlpatterns = [
    path("<slug:slug>/", views.contract_gate, name="contract_gate"),
    path("<slug:slug>/view/", views.contract_view, name="contract_view"),
    path("<slug:slug>/sign/", views.contract_sign, name="contract_sign"),
]
