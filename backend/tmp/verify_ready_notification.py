import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.join(os.getcwd()))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "n3_backend.settings")
django.setup()

from orders.models import Order, OrderStatus, Branch
from notifications.models import Notification, NotificationType
from users.models import User, UserRole
from django.contrib.auth import get_user_model

User = get_user_model()

def verify_ready_notifications():
    print("--- Starting Notification Verification ---")
    
    # 1. Get or create a test branch and users
    branch, _ = Branch.objects.get_or_create(name="Test Branch")
    
    admin, _ = User.objects.get_or_create(
        username="test_admin", 
        defaults={"role": UserRole.ADMIN, "email": "admin@test.com"}
    )
    manager, _ = User.objects.get_or_create(
        username="test_manager", 
        defaults={"role": UserRole.MANAGER, "branch": branch, "email": "manager@test.com"}
    )
    baker, _ = User.objects.get_or_create(
        username="test_baker", 
        defaults={"role": UserRole.BAKER, "branch": branch, "email": "baker@test.com"}
    )
    customer, _ = User.objects.get_or_create(
        username="test_customer", 
        defaults={"role": UserRole.CUSTOMER, "email": "customer@test.com"}
    )

    # 2. Create a test order
    order = Order.objects.create(
        user=customer,
        branch=branch,
        status=OrderStatus.PREPARING,
        total_amount=100.00
    )
    print(f"Created Order #{order.id} with status PREPARING")

    # 3. Simulate the Baker marking it as READY
    # We'll simulate the logic in OrderViewSet.perform_update
    old_status = order.status
    order.status = OrderStatus.READY
    order.save()
    print(f"Updated Order #{order.id} status to {order.status}")

    # Manually trigger the notification logic (replicating OrderViewSet behavior)
    from orders.views import OrderViewSet
    from rest_framework.test import APIRequestFactory
    
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = baker
    
    viewset = OrderViewSet()
    viewset.request = request
    
    if order.status != old_status:
        if order.status == OrderStatus.READY:
            viewset._notify_order_ready(order)
        viewset._notify_customer_status_change(order)

    # 4. Verify Notifications
    notifs = Notification.objects.filter(metadata__order_id=order.id).order_by('-created_at')
    print(f"Total notifications created: {notifs.count()}")
    
    for n in notifs:
        print(f"Notification: to={n.recipient.username} (role={n.recipient.role}), type={n.type}, title='{n.title}'")

    # Check for specific expected notifications
    admin_notif = notifs.filter(recipient=admin, type=NotificationType.ORDER_READY).exists()
    manager_notif = notifs.filter(recipient=manager, type=NotificationType.ORDER_READY).exists()
    customer_notif = notifs.filter(recipient=customer, type=NotificationType.ORDER_STATUS_CHANGED).exists()

    print(f"Admin notified (READY): {admin_notif}")
    print(f"Manager notified (READY): {manager_notif}")
    print(f"Customer notified (STATUS_CHANGED): {customer_notif}")

    if admin_notif and manager_notif and customer_notif:
        print("✅ ALL NOTIFICATIONS VERIFIED SUCCESSFULLY!")
    else:
        print("❌ SOME NOTIFICATIONS ARE MISSING!")

if __name__ == "__main__":
    verify_ready_notifications()
