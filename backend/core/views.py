from rest_framework import viewsets, permissions
from notifications.models import NotificationType
from notifications.services import notify_role
from users.models import User, UserRole

from .models import Branch, Category, Product
from .serializers import BranchSerializer, CategorySerializer, ProductSerializer

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.filter(is_active=True)
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def create(self, request, *args, **kwargs):
        manager_email = request.data.get('manager_email')
        manager_password = request.data.get('manager_password')

        if manager_email and manager_password:
            from rest_framework.exceptions import ValidationError
            if User.objects.filter(username=manager_email).exists() or User.objects.filter(email=manager_email).exists():
                raise ValidationError({"manager_email": ["A user with this email already exists."]})

        # Proceed with branch creation
        response = super().create(request, *args, **kwargs)

        if str(response.status_code).startswith('2') and manager_email and manager_password:
            branch_id = response.data.get('id')
            user = User.objects.create(
                username=manager_email,
                email=manager_email,
                role=UserRole.MANAGER,
                branch_id=branch_id
            )
            user.set_password(manager_password)
            user.save()

        return response

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['category', 'name']

    def get_queryset(self):
        if self.action == 'list':
            return Product.objects.filter(is_available=True)
        return Product.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            context['branch_id'] = branch_id
        return context

    def perform_create(self, serializer):
        product = serializer.save()
        self._notify_product_change(product, created=True)

    def perform_update(self, serializer):
        product = serializer.save()
        self._notify_product_change(product, created=False)

    def _notify_product_change(self, product, *, created):
        action = "added" if created else "updated"
        title = f"Menu item {action}"
        message = (
            f"{product.name} was {action} in the product list"
            f"{f' under {product.category.name}' if product.category_id else ''}."
        )
        metadata = {"product_id": product.id, "action": action}
        notify_role(
            UserRole.ADMIN,
            type=NotificationType.ITEM_UPDATED,
            title=title,
            message=message,
            metadata=metadata,
        )
        notify_role(
            UserRole.MANAGER,
            type=NotificationType.ITEM_UPDATED,
            title=title,
            message=message,
            metadata=metadata,
        )
