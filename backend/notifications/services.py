from django.contrib.auth import get_user_model

from users.models import UserRole

from .models import Notification


def notify_users(users, *, type, title, message, branch=None, metadata=None):
    recipients = list(users)
    if not recipients:
        return []

    notifications = [
        Notification(
            recipient=user,
            branch=branch,
            type=type,
            title=title,
            message=message,
            metadata=metadata or {},
        )
        for user in recipients
    ]
    return Notification.objects.bulk_create(notifications)


def notify_role(role, *, type, title, message, branch=None, metadata=None, user=None):
    if user:
        return notify_users([user], type=type, title=title, message=message, branch=branch, metadata=metadata)
        
    user_model = get_user_model()
    queryset = user_model.objects.filter(role=role, is_active=True)
    if branch is not None and role not in [UserRole.ADMIN, UserRole.BAKER]:
        queryset = queryset.filter(branch=branch)
    return notify_users(
        queryset.distinct(),
        type=type,
        title=title,
        message=message,
        branch=branch,
        metadata=metadata,
    )
