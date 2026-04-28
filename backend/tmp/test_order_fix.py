import json
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from core.models import Product, Branch
from users.models import UserRole

User = get_user_model()
client = APIClient()

# Get manager user
user = User.objects.get(username='manager_test')
client.force_authenticate(user=user)

# Get a product
product = Product.objects.first()

if not product:
    print("Error: No products found in DB. Create a product first.")
else:
    # Payload similar to POSBillingScreen.js (no branch provided)
    payload = {
        "status": "DELIVERED",
        "order_type": "POS",
        "total_amount": 100.00,
        "payment_status": True,
        "items": [
            {
                "product": product.id,
                "quantity": 1,
                "price_at_order": product.price
            }
        ]
    }

    print(f"Sending POS order request as {user.username} (Branch: {user.branch})")
    response = client.post('/api/orders/orders/', data=payload, format='json')

    print(f"Response Status Code: {response.status_code}")
    if response.status_code == 201:
        print("Success! Order created without branch in payload.")
        print(f"Order ID: {response.data['id']}, Assigned Branch: {response.data.get('branch')}")
    else:
        print("Failed!")
        print(f"Response Body: {json.dumps(response.data, indent=2)}")
