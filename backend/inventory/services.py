from django.db import transaction
from inventory.models import Recipe, BranchInventory, BranchProductStock, InventoryLog
from notifications.models import NotificationType
from notifications.services import notify_role
from orders.models import OrderItem
from users.models import UserRole

def _deduction_reason_prefix(order):
    return f"Deducted for Order #{order.id} "

def inventory_already_deducted(order):
    return InventoryLog.objects.filter(
        branch=order.branch,
        reason__startswith=_deduction_reason_prefix(order),
    ).exists()

def deduct_inventory_for_order(order):
    """
    Deducts inventory for a given order from the branch.
    Iterates through each OrderItem, finds the Recipes for the product,
    and deducts the required ingredients.
    Logs each deduction.
    """
    if not order.branch or inventory_already_deducted(order):
        return False

    with transaction.atomic():
        order_items = OrderItem.objects.filter(order=order)
        branch = order.branch

        for item in order_items:
            product = item.product
            quantity = item.quantity

            # 1. Product Stock Deduction (for items manage directly as units)
            product_stock = BranchProductStock.objects.filter(branch=branch, product=product).first()
            if product_stock:
                prev_stock = product_stock.quantity
                product_stock.quantity = max(0, product_stock.quantity - quantity)
                product_stock.save()

                # Log the product deduction
                InventoryLog.objects.create(
                    branch=branch,
                    product=product,
                    change=-quantity,
                    reason=f"{_deduction_reason_prefix(order)}({product.name} x {quantity})"
                )

                # Notification threshold for products is strictly "under 3"
                if prev_stock >= 3 and product_stock.quantity < 3:
                    message = f"{product.name} at {branch.name} is low: {product_stock.quantity} units remaining."
                    metadata = {
                        "stock_id": product_stock.id, 
                        "product_id": product.id, 
                        "quantity": product_stock.quantity
                    }
                    # Notify Admin and Manager for product stock
                    notify_role(UserRole.ADMIN, type=NotificationType.LOW_STOCK, title=f"⚠️ LOW STOCK: {product.name}", message=message, branch=branch, metadata=metadata)
                    notify_role(UserRole.MANAGER, type=NotificationType.LOW_STOCK, title=f"⚠️ LOW STOCK: {product.name}", message=message, branch=branch, metadata=metadata)

            # 2. Ingredient Deduction (from Recipes)
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
                previous_quantity = branch_inv.quantity
                branch_inv.quantity -= amount_needed
                branch_inv.save()

                # Log the change
                InventoryLog.objects.create(
                    branch=branch,
                    ingredient=ingredient,
                    change=-amount_needed,
                    reason=f"{_deduction_reason_prefix(order)}({product.name} x {quantity})"
                )
                
                # Notify if drops strictly UNDER the threshold
                if previous_quantity >= branch_inv.low_stock_threshold and branch_inv.quantity < branch_inv.low_stock_threshold:
                    message = (
                        f"{ingredient.name} at {branch.name} dropped to {branch_inv.quantity} {ingredient.unit} "
                        f"after order #{order.id}."
                    )
                    metadata = {
                        "order_id": order.id,
                        "ingredient_id": ingredient.id,
                        "inventory_id": branch_inv.id,
                    }
                    # Notify Admin, Manager, and Baker for ingredient low stock
                    title = f"⚠️ LOW STOCK: {ingredient.name}"
                    notify_role(UserRole.ADMIN, type=NotificationType.LOW_STOCK, title=title, message=message, branch=branch, metadata=metadata)
                    notify_role(UserRole.MANAGER, type=NotificationType.LOW_STOCK, title=title, message=message, branch=branch, metadata=metadata)
                    notify_role(UserRole.BAKER, type=NotificationType.LOW_STOCK, title=title, message=message, branch=branch, metadata=metadata)

    return True

def revert_inventory_for_order(order):
    """
    Reverts inventory for a cancelled order.
    Finds existing InventoryLog entries for the order and adds back the quantities.
    """
    if not order.branch:
        return False
        
    logs = InventoryLog.objects.filter(
        branch=order.branch,
        reason__startswith=_deduction_reason_prefix(order)
    )
    
    if not logs.exists():
        return False

    with transaction.atomic():
        for log in logs:
            if log.product:
                # Revert Product Stock
                product_stock = BranchProductStock.objects.filter(branch=order.branch, product=log.product).first()
                if product_stock:
                    product_stock.quantity += int(abs(log.change))
                    product_stock.save()
            elif log.ingredient:
                # Revert Ingredient Stock
                branch_inv = BranchInventory.objects.filter(branch=order.branch, ingredient=log.ingredient).first()
                if branch_inv:
                    branch_inv.quantity += abs(log.change)
                    branch_inv.save()
            
            # Create a revert log
            InventoryLog.objects.create(
                branch=order.branch,
                product=log.product,
                ingredient=log.ingredient,
                change=abs(log.change),
                reason=f"Reverted for Order #{order.id} (Cancellation)"
            )
            
            # Notify stock update to trigger refresh on dashboards
            if log.product:
                title = "Stock Recovered"
                message = f"{log.product.name} quantity restored due to cancellation of Order #{order.id}."
                notify_role(UserRole.ADMIN, type=NotificationType.ITEM_UPDATED, title=title, message=message, branch=order.branch)
                notify_role(UserRole.MANAGER, type=NotificationType.ITEM_UPDATED, title=title, message=message, branch=order.branch)
                notify_role(UserRole.CUSTOMER, type=NotificationType.ITEM_UPDATED, title=title, message=message, branch=order.branch)

        # Delete original deduction logs to prevent multiple reverts
        logs.delete()

    return True
