from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "type",
            "title",
            "message",
            "is_read",
            "created_at",
            "branch",
            "branch_name",
            "metadata",
        )
        read_only_fields = (
            "id",
            "type",
            "title",
            "message",
            "created_at",
            "branch",
            "branch_name",
            "metadata",
        )
