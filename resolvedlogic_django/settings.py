"""
Resolved Logic — Django settings.

Adapted from the django-admin default. Notable deviations from a
bare startproject are called out in comments below.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: don't hardcode this in production. On PythonAnywhere,
# set it as an environment variable (Web tab -> "Environment variables"),
# or load from a .env file that's NOT committed to git.
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-CHANGE-ME-before-deploying",
)

# Flip to False for production. On PythonAnywhere set DJANGO_DEBUG=False
# as an env var; leaving DEBUG on in production leaks stack traces
# (including your source paths) to anyone who triggers an error.
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get(
    "DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost"
).split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "contracts",
    "pages",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "resolvedlogic_django.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "resolvedlogic_django.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Australia/Sydney"
USE_I18N = True
USE_TZ = True

# ── Static files (CSS, JS, images) ──
STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles_collected"  # populated by collectstatic on deploy

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Resolved Logic custom settings ──

# Your existing static HTML pages (home.html, designs.html, about.html,
# contact.html, terms.html, privacy.html) live here, served as-is by
# the pages app's serve_page view.
PAGES_DIR = BASE_DIR / "pages_html"

# Signed contract PNGs are written here — deliberately NOT under
# static/ or STATIC_ROOT, so they're never web-accessible.
SIGNATURES_DIR = BASE_DIR / "signatures"

# ── Session / cookie hardening ──
# These only bite once you're serving over HTTPS (which you should be
# for anything handling a signature). Leave SESSION_COOKIE_SECURE and
# CSRF_COOKIE_SECURE off for local http:// testing, flip on via env
# var in production.
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # JS needs to read this one to send X-CSRFToken
SESSION_COOKIE_SECURE = os.environ.get("DJANGO_COOKIE_SECURE", "False") == "True"
CSRF_COOKIE_SECURE = os.environ.get("DJANGO_COOKIE_SECURE", "False") == "True"
SESSION_COOKIE_AGE = 60 * 60 * 2  # 2 hours
