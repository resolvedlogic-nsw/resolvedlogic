from django.core.management.base import BaseCommand, CommandError

from contracts.models import Contract, normalize_mobile


class Command(BaseCommand):
    help = "Create a new client contract record for the signing flow."

    def add_arguments(self, parser):
        parser.add_argument("--slug", required=True, help="URL slug, e.g. budgettyreshed")
        parser.add_argument("--client-name", required=True)
        parser.add_argument("--mobile", required=True, help="As the client would type it, e.g. '0412 345 678'")
        parser.add_argument("--contract-version", required=True, help="e.g. 2026-07-01-v1")
        parser.add_argument("--body-file", required=True,
                             help="Path to an HTML file containing just the contract "
                                  "body (heading down to, but not including, the "
                                  "signature box)")

    def handle(self, *args, **options):
        if Contract.objects.filter(slug=options["slug"]).exists():
            raise CommandError(f"A contract with slug '{options['slug']}' already exists.")

        try:
            with open(options["body_file"], "r", encoding="utf-8") as f:
                contract_html = f.read()
        except OSError as e:
            raise CommandError(f"Couldn't read body file: {e}")

        contract = Contract.objects.create(
            slug=options["slug"],
            client_name=options["client_name"],
            client_mobile_normalized=normalize_mobile(options["mobile"]),
            contract_version=options["contract_version"],
            contract_html=contract_html,
        )

        self.stdout.write(self.style.SUCCESS(
            f"Created contract for {contract.client_name}. "
            f"Client access URL: /contract/{contract.slug}/"
        ))
