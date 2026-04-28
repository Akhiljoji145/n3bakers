from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from notifications.models import NotificationType
from notifications.services import notify_role
from users.models import UserRole

from .models import BulkOrder, Order, OrderItem, OrderStatus
from .serializers import OrderSerializer, OrderItemSerializer
from inventory.services import deduct_inventory_for_order

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'BAKER']:
            return Order.objects.all()
        if user.role == 'MANAGER':
            return Order.objects.filter(branch=user.branch)
        return Order.objects.filter(user=user)

    def perform_create(self, serializer):
        branch = serializer.validated_data.get("branch") or self.request.user.branch
        
        if not branch:
            # If no branch is selected and user has no branch assigned, we cannot proceed
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"branch": "This field is required if you don't have a default branch assigned."})
            
        order = serializer.save(user=self.request.user, branch=branch)
        
        # Do not notify all users for POS billing orders
        if order.order_type != 'POS':
            self._notify_new_order(order)

        # Reserve stock as soon as an order is placed; repeat deductions are ignored.
        if order.order_type != 'BULK':
            deduct_inventory_for_order(order)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        order = serializer.save()
        
        # Deduct inventory when baker starts preparing (if not already deducted by POS)
        if order.status == 'PREPARING' and old_status == 'PENDING' and order.order_type != 'POS':
            deduct_inventory_for_order(order)
            
        if order.status != old_status:
            if order.status == OrderStatus.PREPARING:
                self._notify_baking_started(order)
            elif order.status == OrderStatus.READY:
                self._notify_order_ready(order)
            
            # Notify Customer
            self._notify_customer_status_change(order)

    def _notify_customer_status_change(self, order):
        status_messages = {
            OrderStatus.PREPARING: "Your order is now being prepared! 🥖",
            OrderStatus.READY: "Great news! Your order is ready for pickup/delivery! 🥯",
            OrderStatus.DELIVERED: "Your order has been delivered. Enjoy your fresh bakes! 🥐",
            OrderStatus.CANCELLED: "Your order has been cancelled. Please contact us for details."
        }
        
        message = status_messages.get(order.status)
        if message and order.user:
            notify_role(
                None,  # No specific role, targeting a specific user
                type=NotificationType.ORDER_STATUS_CHANGED,
                title=f"Order #{order.id} Update",
                message=message,
                user=order.user,
                branch=order.branch,
                metadata={"order_id": order.id, "status": order.status}
            )

    def _notify_new_order(self, order):
        title = f"New order #{order.id}"
        message = (
            f"{order.order_type} order received for {order.branch.name}. "
            f"Total: Rs. {order.total_amount}."
        )
        metadata = {"order_id": order.id, "status": order.status}
        notify_role(
            UserRole.ADMIN,
            type=NotificationType.NEW_ORDER,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.MANAGER,
            type=NotificationType.NEW_ORDER,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.BAKER,
            type=NotificationType.NEW_ORDER,
            title=title,
            message=f"Order #{order.id} is waiting to be started in {order.branch.name}.",
            branch=order.branch,
            metadata=metadata,
        )

    def _notify_baking_started(self, order):
        actor = self.request.user.get_full_name() or self.request.user.username
        title = f"Baking started for order #{order.id}"
        message = f"{actor} started preparing order #{order.id} at {order.branch.name}."
        metadata = {"order_id": order.id, "status": order.status}
        notify_role(
            UserRole.ADMIN,
            type=NotificationType.BAKING_STARTED,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.MANAGER,
            type=NotificationType.BAKING_STARTED,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )

    def _notify_order_ready(self, order):
        actor = self.request.user.get_full_name() or self.request.user.username
        title = f"Order #{order.id} is READY"
        message = f"{actor} has finished preparing order #{order.id} at {order.branch.name}. Ready for pickup/delivery."
        metadata = {"order_id": order.id, "status": order.status}
        
        notify_role(
            UserRole.ADMIN,
            type=NotificationType.ORDER_READY,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.MANAGER,
            type=NotificationType.ORDER_READY,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )

    @action(detail=True, methods=["post"], url_path="confirm-pickup")
    def confirm_pickup(self, request, pk=None):
        """Store staff confirms customer pickup for a READY order."""
        order = self.get_object()

        # Pickup confirmation is handled by store managers/admins, not bakers.
        if request.user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise PermissionDenied("Only managers or admins can confirm order pickups.")

        if order.status != OrderStatus.READY:
            raise ValidationError(
                {"detail": f"Cannot confirm pickup. Order is currently '{order.status}', not 'READY'."}
            )

        order.status = OrderStatus.DELIVERED
        order.save(update_fields=["status"])

        self._notify_pickup_confirmed(order)
        return Response({"detail": "Pickup confirmed. Enjoy your bakes! 🥐"}, status=status.HTTP_200_OK)

    def _notify_pickup_confirmed(self, order):
        staff_name = self.request.user.get_full_name() or self.request.user.username
        title = f"Order #{order.id} Handed Over ✅"
        message = f"{staff_name} confirmed handover of Order #{order.id} to the customer."
        metadata = {"order_id": order.id, "status": OrderStatus.DELIVERED}

        notify_role(
            UserRole.ADMIN,
            type=NotificationType.ORDER_PICKED_UP,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.MANAGER,
            type=NotificationType.ORDER_PICKED_UP,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )
        # Also notify customer that order is marked complete
        notify_role(
            None,
            type=NotificationType.ORDER_STATUS_CHANGED,
            title=f"Order #{order.id} Complete!",
            message="Your order has been handed over to you. Thanks for choosing N3 Bakers! 🎉",
            user=order.user,
            branch=order.branch,
            metadata=metadata,
        )

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """Customer or Staff cancels a PENDING order."""
        order = self.get_object()

        # Only allow cancellation if order is PENDING or PREPARING
        if order.status not in [OrderStatus.PENDING, OrderStatus.PREPARING]:
            raise ValidationError(
                {"detail": f"Cannot cancel order. Order is currently '{order.status}', and only orders that are not yet 'READY' can be cancelled."}
            )

        # Ensure user has permission
        if request.user.role == 'CUSTOMER' and order.user != request.user:
            raise PermissionDenied("You can only cancel your own orders.")

        order.status = OrderStatus.CANCELLED
        order.save(update_fields=["status"])

        # Revert inventory if it was deducted
        from inventory.services import revert_inventory_for_order
        revert_inventory_for_order(order)

        self._notify_order_cancelled(order)
        return Response({"detail": "Order cancelled successfully."}, status=status.HTTP_200_OK)

    def _notify_order_cancelled(self, order):
        actor = self.request.user.get_full_name() or self.request.user.username
        title = f"Order #{order.id} Cancelled ❌"
        message = f"Order #{order.id} has been cancelled by {actor}."
        metadata = {"order_id": order.id, "status": OrderStatus.CANCELLED}

        notify_role(
            UserRole.ADMIN,
            type=NotificationType.ORDER_STATUS_CHANGED,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.MANAGER,
            type=NotificationType.ORDER_STATUS_CHANGED,
            title=title,
            message=message,
            branch=order.branch,
            metadata=metadata,
        )
        # Also notify customer if staff cancelled it
        if order.user and self.request.user != order.user:
            notify_role(
                None,
                type=NotificationType.ORDER_STATUS_CHANGED,
                title=title,
                message="Your order has been cancelled. Please contact the branch for more details.",
                user=order.user,
                branch=order.branch,
                metadata=metadata,
            )
