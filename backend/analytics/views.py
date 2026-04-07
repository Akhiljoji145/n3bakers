from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from orders.models import Order, OrderItem
from inventory.models import Recipe

class ProductionPlanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get all PENDING orders for the user's branch
        if user.role == 'ADMIN':
            orders = Order.objects.filter(status='PENDING')
        elif user.branch:
            orders = Order.objects.filter(branch=user.branch, status='PENDING')
        else:
            return Response({"error": "No branch assigned to user"}, status=400)

        # Aggregate required products
        items = OrderItem.objects.filter(order__in=orders)
        product_totals = {}
        for item in items:
            if item.product.id not in product_totals:
                product_totals[item.product.id] = {
                    'name': item.product.name,
                    'quantity': 0
                }
            product_totals[item.product.id]['quantity'] += item.quantity

        # Calculate required ingredients based on recipes
        ingredient_totals = {}
        for product_id, data in product_totals.items():
            recipes = Recipe.objects.filter(product_id=product_id)
            for recipe in recipes:
                ing_id = recipe.ingredient.id
                if ing_id not in ingredient_totals:
                    ingredient_totals[ing_id] = {
                        'name': recipe.ingredient.name,
                        'unit': recipe.ingredient.unit,
                        'quantity': 0
                    }
                ingredient_totals[ing_id]['quantity'] += (recipe.quantity * data['quantity'])

        return Response({
            'pending_orders_count': orders.count(),
            'products_to_bake': list(product_totals.values()),
            'ingredients_needed': list(ingredient_totals.values())
        })
