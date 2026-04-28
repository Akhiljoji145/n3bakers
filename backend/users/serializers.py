from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import UserRole

User = get_user_model()


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field, "")
        password = attrs.get("password", "")

        if isinstance(identifier, str):
            identifier = identifier.strip()
            attrs[self.username_field] = identifier

        resolved_username = self._resolve_username(identifier, password)
        if resolved_username:
            attrs[self.username_field] = resolved_username

        return super().validate(attrs)

    def _resolve_username(self, identifier, password):
        if not identifier:
            return identifier

        username_lookup = {self.username_field: identifier}
        if User.objects.filter(**username_lookup).exists():
            return identifier

        candidates = User.objects.filter(
            Q(email__iexact=identifier) | Q(**{f"{self.username_field}__iexact": identifier})
        )

        for user in candidates:
            if user.check_password(password):
                return getattr(user, self.username_field)

        first_candidate = candidates.first()
        if first_candidate:
            return getattr(first_candidate, self.username_field)

        return identifier

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'secondary_role', 'branch', 'password')
        extra_kwargs = {
            'password': {'write_only': True},
            'secondary_role': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def create(self, validated_data):
        request = self.context.get('request')
        user = None
        if request and hasattr(request, "user"):
            user = request.user

        is_management = bool(
            user and
            user.is_authenticated and
            user.role in [UserRole.ADMIN, UserRole.MANAGER]
        )

        role = validated_data.get('role', UserRole.CUSTOMER)
        branch = validated_data.get('branch')
        password = validated_data.pop('password')

        if is_management and user.role == UserRole.MANAGER:
            branch = user.branch
            if role == UserRole.ADMIN:
                role = UserRole.BAKER

        # Create user with default DRF hashing-friendly method
        new_user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=password,
            role=role if is_management else UserRole.CUSTOMER,
            secondary_role=validated_data.get('secondary_role') if is_management else None,
            branch=branch if is_management else None,
        )

        # Ensure staff flag is set for those who need to access management areas
        if new_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.BAKER]:
            new_user.is_staff = True
            new_user.save(update_fields=['is_staff'])

        return new_user

    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = None
        if request and hasattr(request, "user"):
            user = request.user

        is_management = bool(
            user and
            user.is_authenticated and
            user.role in [UserRole.ADMIN, UserRole.MANAGER]
        )

        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))

        if not is_management:
            validated_data.pop('role', None)
            validated_data.pop('secondary_role', None)
            validated_data.pop('branch', None)

        if is_management and user.role == UserRole.MANAGER:
            # Managers can't change branch or promote to Admin
            validated_data.pop('branch', None)
            if validated_data.get('role') == UserRole.ADMIN:
                validated_data.pop('role')

        # Explicitly handle secondary_role = null/empty to clear it
        if is_management and 'secondary_role' in validated_data:
            sr = validated_data['secondary_role']
            validated_data['secondary_role'] = sr if sr else None

        return super().update(instance, validated_data)
