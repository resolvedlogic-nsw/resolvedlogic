import re

from django.db import models


def normalize_mobile(raw: str) -> str:
    """Strip everything except digits, drop a leading 61 (AU country
    code) or leading 0, so '0412 345 678', '+61412345678' and
    '61 412 345 678' all normalize to '412345678'."""
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("61"):
        digits = digits[2:]
    if digits.startswith("0"):
        digits = digits[1:]
    return digits


class Contract(models.Model):
    slug = models.SlugField(unique=True, help_text="Used in the URL, e.g. 'budgettyreshed'")
    client_name = models.CharField(max_length=255)
    client_mobile_normalized = models.CharField(
        max_length=20,
        help_text="Stored normalized (digits only, no leading 0/61). "
                   "Set via the admin save hook or the add_contract "
                   "management command — see save() below.",
    )
    contract_version = models.CharField(max_length=50, help_text="e.g. 2026-07-01-v1")
    contract_html = models.TextField(
        help_text="Trusted HTML you author yourself — rendered with |safe. "
                   "Never populate this from client-submitted input."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Always re-normalize on save so pasting a raw number into the
        # admin (with spaces/dashes/+61) still compares correctly later.
        self.client_mobile_normalized = normalize_mobile(self.client_mobile_normalized)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client_name} ({self.slug})"


class Signature(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.PROTECT, related_name="signatures")
    name_typed = models.CharField(max_length=255)
    signature_path = models.CharField(max_length=255, help_text="Relative path under SIGNATURES_DIR")
    contract_version = models.CharField(max_length=50)
    signed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name_typed} signed {self.contract.slug} @ {self.signed_at:%Y-%m-%d %H:%M}"
