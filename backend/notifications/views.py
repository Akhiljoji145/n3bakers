from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "post", "delete", "head", "options"]

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        unread = self.request.query_params.get("unread")
        if unread and unread.lower() in {"1", "true", "yes"}:
            queryset = queryset.filter(is_read=False)

        limit = self.request.query_params.get("limit")
        if limit:
            try:
                queryset = queryset[: max(int(limit), 1)]
            except ValueError:
                pass

        return queryset

    def partial_update(self, request, *args, **kwargs):
        notification = self.get_object()
        serializer = self.get_serializer(
            notification,
            data={"is_read": request.data.get("is_read", True)},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"updated": updated}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["delete"], url_path="clear-all")
    def clear_all(self, request):
        """Delete all notifications for the requesting user only."""
        deleted_count, _ = self.get_queryset().delete()
        return Response({"deleted": deleted_count}, status=status.HTTP_200_OK)
