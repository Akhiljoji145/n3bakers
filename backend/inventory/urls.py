from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, BranchInventoryViewSet, RecipeViewSet

router = DefaultRouter()
router.register(r'ingredients', IngredientViewSet)
router.register(r'branch-inventory', BranchInventoryViewSet, basename='branch-inventory')
router.register(r'recipes', RecipeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
