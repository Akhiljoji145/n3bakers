import os
from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import UserRole


@override_settings(SECURE_SSL_REDIRECT=False)
class LoginTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="customer_user",
            email="customer@example.com",
            password="password123",
        )

    def test_can_login_with_username(self):
        response = self.client.post(
            "/api/token/",
            {"username": "customer_user", "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_can_login_with_email(self):
        response = self.client.post(
            "/api/token/",
            {"username": "customer@example.com", "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_identifier_is_trimmed(self):
        response = self.client.post(
            "/api/token/",
            {"username": "  customer@example.com  ", "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)


class CreateAdminCommandTests(TestCase):
    @patch.dict(
        os.environ,
        {
            "ADMIN_USERNAME": "admin",
            "ADMIN_EMAIL": "admin@n3bakers.com",
            "ADMIN_PASSWORD": "reset-pass-123",
        },
        clear=False,
    )
    def test_create_admin_creates_missing_user(self):
        out = StringIO()

        call_command("create_admin", stdout=out)

        user = get_user_model().objects.get(username="admin")
        self.assertEqual(user.email, "admin@n3bakers.com")
        self.assertEqual(user.role, UserRole.ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.check_password("reset-pass-123"))

    @patch.dict(
        os.environ,
        {
            "ADMIN_USERNAME": "admin",
            "ADMIN_EMAIL": "admin@n3bakers.com",
            "ADMIN_PASSWORD": "reset-pass-123",
        },
        clear=False,
    )
    def test_create_admin_updates_existing_user_credentials(self):
        user = get_user_model().objects.create_user(
            username="admin",
            email="old@example.com",
            password="old-pass-123",
            role=UserRole.CUSTOMER,
        )
        self.assertTrue(user.check_password("old-pass-123"))

        out = StringIO()
        call_command("create_admin", stdout=out)

        user.refresh_from_db()
        self.assertEqual(user.email, "admin@n3bakers.com")
        self.assertEqual(user.role, UserRole.ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.check_password("reset-pass-123"))
