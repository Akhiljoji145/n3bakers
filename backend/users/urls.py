from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreateUserView, UserProfileView, UserViewSet

router = DefaultRouter()
router.register(r'management', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', CreateUserView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
]
