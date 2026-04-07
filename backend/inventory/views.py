from rest_framework import viewsets, permissions
from .models import Ingredient, BranchInventory, Recipe, InventoryLog
from .serializers import IngredientSerializer, BranchInventorySerializer, RecipeSerializer

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.IsAdminUser] # Admin manages ingredients

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

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
