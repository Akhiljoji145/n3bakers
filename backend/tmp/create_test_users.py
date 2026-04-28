import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "n3_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from core.models import Branch
from users.models import UserRole

User = get_user_model()
branch = Branch.objects.filter(id=3).first()

users_to_create = [
    {'username': 'admin_test', 'role': UserRole.ADMIN, 'branch': None},
    {'username': 'manager_test', 'role': UserRole.MANAGER, 'branch': branch},
    {'username': 'baker_test', 'role': UserRole.BAKER, 'branch': branch},
    {'username': 'customer_test', 'role': UserRole.CUSTOMER, 'branch': None},
]

for user_data in users_to_create:
    username = user_data['username']
    role = user_data['role']
    branch_obj = user_data['branch']
    
    user, created = User.objects.get_or_create(username=username)
    user.role = role
    user.branch = branch_obj
    user.set_password('testpassword123')
    user.is_staff = (role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.BAKER])
    user.is_superuser = (role == UserRole.ADMIN)
    user.save()
    print(f"User {username} ({role}) {'created' if created else 'updated'}")
