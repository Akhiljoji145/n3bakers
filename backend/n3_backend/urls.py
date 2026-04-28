from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from users.views import EmailOrUsernameTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", EmailOrUsernameTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/core/", include("core.urls")),
    path("api/users/", include("users.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/notifications/", include("notifications.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
