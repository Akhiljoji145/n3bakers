import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from core.models import Branch


class Command(BaseCommand):
    help = "Create or update the demo users used by the mobile app."

    def handle(self, *args, **options):
        password = os.environ.get("DEMO_USER_PASSWORD", "password123")
        branch_name = os.environ.get("DEMO_BRANCH_NAME", "Main Branch")
        branch_location = os.environ.get("DEMO_BRANCH_LOCATION", "Default Render branch")

        branch, _ = Branch.objects.get_or_create(
            name=branch_name,
            defaults={"location": branch_location, "is_active": True},
        )

        User = get_user_model()
        users = [
            {
                "username": "admin_test",
                "email": "admin_test@example.com",
                "role": "ADMIN",
                "branch": None,
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "username": "manager_test",
                "email": "manager_test@example.com",
                "role": "MANAGER",
                "branch": branch,
                "is_staff": False,
                "is_superuser": False,
            },
            {
                "username": "baker_test",
                "email": "baker_test@example.com",
                "role": "BAKER",
                "branch": branch,
                "is_staff": False,
                "is_superuser": False,
            },
            {
                "username": "customer_test",
                "email": "customer_test@example.com",
                "role": "CUSTOMER",
                "branch": None,
                "is_staff": False,
                "is_superuser": False,
            },
        ]

        for spec in users:
            user, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={
                    "email": spec["email"],
                    "role": spec["role"],
                    "branch": spec["branch"],
                    "is_staff": spec["is_staff"],
                    "is_superuser": spec["is_superuser"],
                },
            )

            user.email = spec["email"]
            user.role = spec["role"]
            user.branch = spec["branch"]
            user.is_staff = spec["is_staff"]
            user.is_superuser = spec["is_superuser"]
            user.set_password(password)
            user.save()

            state = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{state} demo user: {user.username}"))

        self.stdout.write(self.style.SUCCESS(f"Demo users ready. Password: {password}"))
