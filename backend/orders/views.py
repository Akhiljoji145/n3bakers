from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Order, OrderItem, BulkOrder
from .serializers import OrderSerializer, OrderItemSerializer
from inventory.services import deduct_inventory_for_order

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Order.objects.all()
        if user.role in ['MANAGER', 'BAKER']:
            return Order.objects.filter(branch=user.branch)
        return Order.objects.filter(user=user)

    def perform_create(self, serializer):
        # Default branch if not specified (for customers) or use user's branch (for managers)
        branch = self.request.data.get('branch')
        if not branch and self.request.user.branch:
            branch = self.request.user.branch
        order = serializer.save(user=self.request.user)

        # If it's a POS order, deduct inventory immediately since it's already done
        if order.order_type == 'POS' or order.status == 'PREPARING':
            deduct_inventory_for_order(order)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        order = serializer.save()
        
        # Deduct inventory when baker starts preparing (if not already deducted by POS)
        if order.status == 'PREPARING' and old_status == 'PENDING' and order.order_type != 'POS':
            deduct_inventory_for_order(order)
