import os

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.urls import reverse


def home_redirect(request):
    return HttpResponseRedirect("/home.html")


def serve_page(request, filename):
    """Serves your existing static HTML pages (home.html, designs.html,
    about.html, contact.html, terms.html, privacy.html, ...) unchanged,
    out of PAGES_DIR. Only .html is allowed through — anything else
    (images, fonts someone links directly) 404s rather than exposing
    the filesystem. Real static assets (css/js/img) are handled by
    Django's staticfiles app instead, not this view.
    """
    if not filename.endswith(".html"):
        raise Http404
    full_path = os.path.join(settings.PAGES_DIR, filename)
    # Guard against path traversal (e.g. '../../etc/passwd.html')
    if not os.path.abspath(full_path).startswith(os.path.abspath(settings.PAGES_DIR)):
        raise Http404
    if not os.path.isfile(full_path):
        raise Http404
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    return HttpResponse(content)
