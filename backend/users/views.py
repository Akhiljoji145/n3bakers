from rest_framework import generics, permissions, viewsets
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import EmailOrUsernameTokenObtainPairSerializer, UserSerializer

User = get_user_model()


class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer

class IsAdminUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.role == 'ADMIN')

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return User.objects.all()
        if user.role == 'MANAGER':
            return User.objects.filter(branch=user.branch)
        return User.objects.filter(id=user.id)

class CreateUserView(generics.CreateAPIView):
    model = User
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
