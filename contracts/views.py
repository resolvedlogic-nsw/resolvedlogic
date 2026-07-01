import base64
import json
import os
import secrets
from datetime import timedelta

from django.conf import settings
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_http_methods

from .models import Contract, Signature, normalize_mobile

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _auth_key(slug):
    return f"contract_auth_{slug}"


def _attempts_key(slug):
    return f"contract_attempts_{slug}"


def _lockout_key(slug):
    return f"contract_lockout_{slug}"


def _is_locked_out(request, slug):
    until = request.session.get(_lockout_key(slug))
    if not until:
        return False
    if timezone.now().isoformat() < until:
        return True
    # lockout expired — clear it
    request.session.pop(_lockout_key(slug), None)
    request.session.pop(_attempts_key(slug), None)
    return False


def _register_failed_attempt(request, slug):
    count = request.session.get(_attempts_key(slug), 0) + 1
    request.session[_attempts_key(slug)] = count
    if count >= MAX_LOGIN_ATTEMPTS:
        request.session[_lockout_key(slug)] = (
            timezone.now() + timedelta(minutes=LOCKOUT_MINUTES)
        ).isoformat()


@require_http_methods(["GET", "POST"])
def contract_gate(request, slug):
    contract = get_object_or_404(Contract, slug=slug)

    if request.session.get(_auth_key(slug)):
        return redirect("contract_view", slug=slug)

    error = None
    locked_out = _is_locked_out(request, slug)

    if request.method == "POST":
        if locked_out:
            error = f"Too many attempts. Try again in {LOCKOUT_MINUTES} minutes."
        else:
            submitted = normalize_mobile(request.POST.get("mobile", ""))
            if submitted and submitted == contract.client_mobile_normalized:
                request.session[_auth_key(slug)] = True
                request.session.pop(_attempts_key(slug), None)
                request.session.pop(_lockout_key(slug), None)
                request.session.set_expiry(60 * 60 * 2)  # 2 hours
                return redirect("contract_view", slug=slug)
            else:
                _register_failed_attempt(request, slug)
                # Recheck immediately — this request may be the one that
                # just tripped the lockout, and we want that reflected
                # in the response we're about to render, not just on
                # the next request.
                locked_out = _is_locked_out(request, slug)
                if locked_out:
                    error = f"Too many attempts. Try again in {LOCKOUT_MINUTES} minutes."
                else:
                    error = "That mobile number doesn't match our records."

    return render(request, "contract_login.html", {
        "client_name": contract.client_name,
        "error": error,
        "locked_out": locked_out,
    })


@ensure_csrf_cookie
def contract_view(request, slug):
    contract = get_object_or_404(Contract, slug=slug)

    if not request.session.get(_auth_key(slug)):
        return redirect("contract_gate", slug=slug)

    return render(request, "contract.html", {
        "slug": slug,
        "client_name": contract.client_name,
        "contract_version": contract.contract_version,
        "contract_html": contract.contract_html,  # trusted content, see model docstring
    })


@require_POST
def contract_sign(request, slug):
    contract = get_object_or_404(Contract, slug=slug)

    if not request.session.get(_auth_key(slug)):
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    name = (data.get("name") or "").strip()
    signature_data_url = data.get("signature") or ""
    submitted_version = data.get("contract_version") or ""

    if not name or not signature_data_url:
        return JsonResponse({"error": "Missing name or signature"}, status=400)
    if submitted_version != contract.contract_version:
        # Contract text changed under them mid-flow — reject rather
        # than silently signing a version mismatch.
        return JsonResponse({"error": "Contract version mismatch, please reload"}, status=409)

    try:
        header, b64data = signature_data_url.split(",", 1)
        png_bytes = base64.b64decode(b64data)
    except (ValueError, base64.binascii.Error):
        return JsonResponse({"error": "Invalid signature data"}, status=400)

    os.makedirs(settings.SIGNATURES_DIR, exist_ok=True)
    filename = f"{slug}_{secrets.token_hex(8)}.png"
    filepath = os.path.join(settings.SIGNATURES_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(png_bytes)

    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    ip = forwarded_for.split(",")[0].strip() if forwarded_for else request.META.get("REMOTE_ADDR")

    Signature.objects.create(
        contract=contract,
        name_typed=name,
        signature_path=filename,
        contract_version=submitted_version,
        ip_address=ip,
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
    )

    # Once signed, don't leave this authenticated in the session —
    # a shared/public computer shouldn't stay unlocked on this contract.
    request.session.pop(_auth_key(slug), None)

    return JsonResponse({"status": "ok"})
