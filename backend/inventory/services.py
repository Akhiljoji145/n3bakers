from django.db import transaction
from inventory.models import Recipe, BranchInventory, InventoryLog
from orders.models import OrderItem

def deduct_inventory_for_order(order):
    """
    Deducts inventory for a given order from the branch.
    Iterates through each OrderItem, finds the Recipes for the product,
    and deducts the required ingredients.
    Logs each deduction.
    """
    with transaction.atomic():
        order_items = OrderItem.objects.filter(order=order)
        branch = order.branch

        for item in order_items:
            product = item.product
            quantity = item.quantity

            # Find recipes for this product
            recipes = Recipe.objects.filter(product=product)

            for recipe in recipes:
                ingredient = recipe.ingredient
                amount_needed = recipe.quantity * quantity

                # Get or Create BranchInventory for this ingredient
                branch_inv, created = BranchInventory.objects.get_or_create(
                    branch=branch,
                    ingredient=ingredient,
                    defaults={'quantity': 0}
                )

                # Deduct stock
                branch_inv.quantity -= amount_needed
                branch_inv.save()

                # Log the change
                InventoryLog.objects.create(
                    branch=branch,
                    ingredient=ingredient,
                    change=-amount_needed,
                    reason=f'Deducted for Order #{order.id} ({product.name} x {quantity})'
                )

    return True
