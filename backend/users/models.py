from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    MANAGER = 'MANAGER', 'Branch Manager'
    BAKER = 'BAKER', 'Baker'
    CUSTOMER = 'CUSTOMER', 'Customer'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER
    )
    branch = models.ForeignKey(
        'core.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff'
    )
    secondary_role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
