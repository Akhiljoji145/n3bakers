from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


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
