from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BranchViewSet, CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register(r'branches', BranchViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
