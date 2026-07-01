from django.contrib import admin

from .models import Contract, Signature


class SignatureInline(admin.TabularInline):
    model = Signature
    extra = 0
    readonly_fields = ("name_typed", "signature_path", "contract_version",
                        "signed_at", "ip_address", "user_agent")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("client_name", "slug", "contract_version", "created_at", "is_signed")
    search_fields = ("client_name", "slug")
    inlines = [SignatureInline]

    @admin.display(boolean=True, description="Signed")
    def is_signed(self, obj):
        return obj.signatures.exists()


@admin.register(Signature)
class SignatureAdmin(admin.ModelAdmin):
    list_display = ("contract", "name_typed", "signed_at", "ip_address")
    readonly_fields = ("contract", "name_typed", "signature_path", "contract_version",
                        "signed_at", "ip_address", "user_agent")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
