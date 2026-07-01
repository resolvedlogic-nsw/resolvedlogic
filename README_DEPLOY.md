# Converting resolvedlogic from static → Django on PythonAnywhere

You already know this dance from FosterRoster/the tyre CRM, so this is
just what's specific to this project.

## 1. Upload the project
```
cd ~
# upload/clone this whole resolvedlogic_django/ folder here
```

## 2. Virtualenv + deps
```
cd ~/resolvedlogic_django
mkvirtualenv --python=/usr/bin/python3.12 resolvedlogic-venv
pip install -r requirements.txt
```

## 3. Environment variables
Web tab → your app → "Environment variables":

| Key | Value |
|---|---|
| `DJANGO_SECRET_KEY` | output of `python3 -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `yourdomain.com,www.yourdomain.com` (comma-separated, no spaces) |
| `DJANGO_COOKIE_SECURE` | `True` (once you've confirmed HTTPS is working — leave `False` while testing on http://) |

## 4. Web tab config
- Source code: `/home/<you>/resolvedlogic_django`
- Working directory: same
- WSGI file → point it at your project's `resolvedlogic_django/wsgi.py`
  (same pattern as your other Django apps — edit the PA-generated
  `wsgi.py` to import from here, or symlink).
- Static files mapping:
  - URL: `/static/` → Directory: `/home/<you>/resolvedlogic_django/staticfiles_collected/`

## 5. Migrate + collectstatic
```
python3 manage.py migrate
python3 manage.py collectstatic --noinput
```

## 6. Move your existing pages in (already done in this bundle)
Your `home.html`, `designs.html`, `about.html`, `contact.html`,
`terms.html`, `privacy.html` live in `pages_html/` and are served
byte-for-byte unchanged by `pages.views.serve_page` — no link rewrites
needed, `home.html` still links to `designs.html` etc. exactly as
before. `style.css`, `scripts.js`, and `img/` live in `static/`.

## 7. Create a superuser (for the admin)
```
python3 manage.py createsuperuser
```
Contracts and signatures are registered in `/django-admin/` — signed
contracts show as read-only inline rows under each Contract, so you
can see who signed what, when, from what IP, without writing any
extra tooling.

## 8. Create your first contract
```
python3 manage.py add_contract \
  --slug budgettyreshed \
  --client-name "Budget Tyre Shed" \
  --mobile "0412 345 678" \
  --contract-version "2026-07-01-v1" \
  --body-file /path/to/budgettyreshed_body.html
```
The body file is just the contract sections — from the first
`<h2 class="contract-section-title">` down to (not including) the
signature box, which the template supplies. Client then visits
`https://yourdomain.com/contract/budgettyreshed/`.

## 9. Reload the web app

---

## Security checklist (already wired up, listed so you know what's covered)
- Mobile number normalized both at storage time (`Contract.save()`) and
  compare time — `0412 345 678`, `+61412345678`, `61412345678` all match.
- 5 failed attempts → 15 minute session-scoped lockout, and the
  response that *trips* the lockout shows the lockout message
  immediately (tested this — the naive version has an off-by-one
  where the 5th failed attempt still shows "wrong number" instead of
  "locked out" until the next request).
- CSRF protection via Django's built-in middleware — the contract view
  uses `@ensure_csrf_cookie` so the signature `fetch()` can always grab
  a token, even though the page has no `<form>` for Django to
  auto-inject one into.
- Contract version is re-checked server-side at signing time, not just
  carried as a hidden field — editing the contract text after sending
  the link invalidates in-flight signing attempts on the old version.
- Signature PNGs write to `SIGNATURES_DIR` (outside `STATIC_ROOT`), so
  they're never web-accessible.
- `contract_html` is rendered with `|safe` — this is fine *only*
  because you're the only one who ever populates it (via `add_contract`
  or the admin). Never wire a public-facing form to that field.
- Session auth flag is cleared immediately after a successful sign, so
  a shared/public computer doesn't stay unlocked on that contract.

## Still worth doing yourself
- Back up `db.sqlite3` and `signatures/` as part of your existing
  backup routine — they're new state that didn't exist when the site
  was static.
- If you ever reuse this for many clients at once, session-based
  lockout can be bypassed by clearing cookies — worth adding
  IP-based rate limiting (e.g. `django-ratelimit`) at that point.
