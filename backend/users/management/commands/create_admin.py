import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from users.models import UserRole

User = get_user_model()


class Command(BaseCommand):
    help = "Create or update the configured admin user"

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME", "admin")
        email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
        password = os.environ.get("ADMIN_PASSWORD", "admin123")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "role": UserRole.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        updated_fields = []
        if user.email != email:
            user.email = email
            updated_fields.append("email")
        if user.role != UserRole.ADMIN:
            user.role = UserRole.ADMIN
            updated_fields.append("role")
        if not user.is_staff:
            user.is_staff = True
            updated_fields.append("is_staff")
        if not user.is_superuser:
            user.is_superuser = True
            updated_fields.append("is_superuser")

        user.set_password(password)
        updated_fields.append("password")

        if created:
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully created superuser: {username}"))
            return

        user.save(update_fields=updated_fields)
        self.stdout.write(self.style.SUCCESS(f"Successfully updated superuser: {username}"))
