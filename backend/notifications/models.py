from django.conf import settings
from django.db import models


class NotificationType(models.TextChoices):
    NEW_ORDER = "NEW_ORDER", "New Order"
    BAKING_STARTED = "BAKING_STARTED", "Baking Started"
    ITEM_UPDATED = "ITEM_UPDATED", "Item Updated"
    LOW_STOCK = "LOW_STOCK", "Low Stock"
    ORDER_READY = "ORDER_READY", "Order Ready"
    ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED", "Order Status Changed"
    ORDER_PICKED_UP = "ORDER_PICKED_UP", "Order Picked Up"


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    branch = models.ForeignKey(
        "core.Branch",
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    type = models.CharField(max_length=32, choices=NotificationType.choices)
    title = models.CharField(max_length=120)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "created_at"]),
        ]

    def __str__(self):
        return f"{self.recipient} - {self.title}"
