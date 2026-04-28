from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from notifications.models import NotificationType
from notifications.services import notify_role
from users.models import UserRole

from .models import Ingredient, BranchInventory, BranchProductStock, Recipe, InventoryLog
from .serializers import IngredientSerializer, BranchInventorySerializer, BranchProductStockSerializer, RecipeSerializer

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

class BranchInventoryViewSet(viewsets.ModelViewSet):
    serializer_class = BranchInventorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Branch managers can see their own inventory
        user = self.request.user
        if user.role == 'ADMIN':
            return BranchInventory.objects.all()
        if user.branch:
            return BranchInventory.objects.filter(branch=user.branch)
        return BranchInventory.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        branch = serializer.validated_data.get("branch")
        if user.role != UserRole.ADMIN:
            if not user.branch:
                raise PermissionDenied("You do not have a branch assigned.")
            if branch and branch != user.branch:
                raise PermissionDenied("You can only create inventory for your own branch.")
            target_branch = user.branch
        else:
            if not branch:
                from core.models import Branch
                branch = Branch.objects.filter(is_active=True).first()
            target_branch = branch
            
        try:
            from django.db import IntegrityError
            inventory_item = serializer.save(branch=target_branch)
        except IntegrityError:
            # Upsert: if it already exists, gracefully update it
            inventory_item = BranchInventory.objects.get(
                branch=target_branch, 
                ingredient=serializer.validated_data['ingredient']
            )
            inventory_item.quantity = serializer.validated_data.get('quantity', inventory_item.quantity)
            if 'low_stock_threshold' in serializer.validated_data:
                inventory_item.low_stock_threshold = serializer.validated_data['low_stock_threshold']
            inventory_item.save()
            created = False
        else:
            created = True
            
        self._notify_inventory_change(inventory_item, created=created)
        self._notify_low_stock(inventory_item, previous_quantity=None)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role != UserRole.ADMIN and serializer.instance.branch != user.branch:
            raise PermissionDenied("You can only update inventory for your own branch.")
        previous_quantity = serializer.instance.quantity
        inventory_item = serializer.save()
        self._notify_inventory_change(inventory_item, created=False)
        self._notify_low_stock(inventory_item, previous_quantity=previous_quantity)

    def _notify_inventory_change(self, inventory_item, *, created):
        action = "added" if created else "updated"
        ingredient = inventory_item.ingredient
        title = f"Inventory item {action}"
        message = (
            f"{ingredient.name} at {inventory_item.branch.name} was {action}. "
            f"Current stock: {inventory_item.quantity} {ingredient.unit}."
        )
        metadata = {
            "inventory_id": inventory_item.id,
            "ingredient_id": ingredient.id,
            "action": action,
        }
        notify_role(
            UserRole.ADMIN,
            type=NotificationType.ITEM_UPDATED,
            title=title,
            message=message,
            branch=inventory_item.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.MANAGER,
            type=NotificationType.ITEM_UPDATED,
            title=title,
            message=message,
            branch=inventory_item.branch,
            metadata=metadata,
        )

    def _notify_low_stock(self, inventory_item, *, previous_quantity):
        threshold = inventory_item.low_stock_threshold
        is_low = inventory_item.quantity < threshold
        crossed_down = previous_quantity is None or previous_quantity >= threshold
        if not is_low or not crossed_down:
            return

        ingredient = inventory_item.ingredient
        message = (
            f"{ingredient.name} at {inventory_item.branch.name} is low: "
            f"{inventory_item.quantity} {ingredient.unit} remaining."
        )
        metadata = {
            "inventory_id": inventory_item.id,
            "ingredient_id": ingredient.id,
            "quantity": str(inventory_item.quantity),
        }
        title = f"⚠️ LOW STOCK: {ingredient.name}"
        notify_role(
            UserRole.ADMIN,
            type=NotificationType.LOW_STOCK,
            title=title,
            message=message,
            branch=inventory_item.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.MANAGER,
            type=NotificationType.LOW_STOCK,
            title=title,
            message=message,
            branch=inventory_item.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.BAKER,
            type=NotificationType.LOW_STOCK,
            title=title,
            message=message,
            branch=inventory_item.branch,
            metadata=metadata,
        )

class BranchProductStockViewSet(viewsets.ModelViewSet):
    serializer_class = BranchProductStockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return BranchProductStock.objects.all()
        if user.branch:
            return BranchProductStock.objects.filter(branch=user.branch)
        return BranchProductStock.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        branch = serializer.validated_data.get("branch")
        if user.role != UserRole.ADMIN:
            if not user.branch:
                raise PermissionDenied("You do not have a branch assigned.")
            if branch and branch != user.branch:
                raise PermissionDenied("You can only create product stock for your own branch.")
            target_branch = user.branch
        else:
            if not branch:
                from core.models import Branch
                branch = Branch.objects.filter(is_active=True).first()
            target_branch = branch
            
        try:
            from django.db import IntegrityError
            stock_item = serializer.save(branch=target_branch)
        except IntegrityError:
            stock_item = BranchProductStock.objects.get(
                branch=target_branch, 
                product=serializer.validated_data['product']
            )
            # Find previous quantity to potentially trigger low stock alert correctly
            previous_quantity = stock_item.quantity
            stock_item.quantity = serializer.validated_data.get('quantity', stock_item.quantity)
            stock_item.save()
        else:
            previous_quantity = None

        self._notify_low_product_stock(stock_item, previous_quantity=previous_quantity)
        self._notify_stock_updated(stock_item)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role != UserRole.ADMIN and serializer.instance.branch != user.branch:
            raise PermissionDenied("You can only update product stock for your own branch.")
        previous_quantity = serializer.instance.quantity
        stock_item = serializer.save()
        self._notify_low_product_stock(stock_item, previous_quantity=previous_quantity)
        self._notify_stock_updated(stock_item)

    def _notify_stock_updated(self, stock_item):
        """Notify all relevant roles that stock has been updated to trigger frontend refresh."""
        notify_role(
            UserRole.CUSTOMER,
            type=NotificationType.ITEM_UPDATED,
            title="Stock Updated",
            message=f"Product availability at {stock_item.branch.name} has changed.",
            branch=stock_item.branch,
            metadata={"product_id": stock_item.product.id, "branch_id": stock_item.branch.id}
        )

    def _notify_low_product_stock(self, stock_item, *, previous_quantity):
        threshold = 3
        is_low = stock_item.quantity < threshold
        crossed_down = previous_quantity is None or previous_quantity >= threshold
        if not is_low or not crossed_down:
            return

        product = stock_item.product
        message = (
            f"{product.name} at {stock_item.branch.name} is low: "
            f"{stock_item.quantity} units remaining."
        )
        metadata = {
            "stock_id": stock_item.id,
            "product_id": product.id,
            "quantity": str(stock_item.quantity),
        }
        title = f"⚠️ LOW STOCK: {product.name}"
        notify_role(
            UserRole.ADMIN,
            type=NotificationType.LOW_STOCK,
            title=title,
            message=message,
            branch=stock_item.branch,
            metadata=metadata,
        )
        notify_role(
            UserRole.MANAGER,
            type=NotificationType.LOW_STOCK,
            title=title,
            message=message,
            branch=stock_item.branch,
            metadata=metadata,
        )

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
