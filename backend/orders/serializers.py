from rest_framework import serializers
from django.apps import apps
from core.models import Branch
from .models import Order, OrderItem, BulkOrder

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'quantity', 'price_at_order')

class BulkOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkOrder
        fields = ('schedule_date', 'notes', 'is_approved')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    bulk_details = BulkOrderSerializer(required=False)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    branch = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        required=False
    )

    class Meta:
        model = Order
        fields = ('id', 'user', 'branch', 'branch_name', 'status', 'order_type', 'total_amount', 'payment_status', 'items', 'bulk_details', 'created_at')
        read_only_fields = ('user',)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        bulk_data = validated_data.pop('bulk_details', None)
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        if bulk_data:
            BulkOrder.objects.create(order=order, **bulk_data)
        return order
