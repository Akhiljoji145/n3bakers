
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'n3_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print(f"{'Username':<20} | {'Role':<10} | {'Is Active':<10} | {'Is Staff':<10}")
print("-" * 55)
for user in User.objects.all():
    print(f"{user.username:<20} | {user.role:<10} | {str(user.is_active):<10} | {str(user.is_staff):<10}")
