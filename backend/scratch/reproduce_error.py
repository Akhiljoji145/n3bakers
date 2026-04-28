
import requests
import json

BASE_URL = "http://localhost:8000/api/"

def test_manager_creates_baker():
    # 1. Login as admin
    login_data = {
        "username": "jojimaliyil@gmail.com",
        "password": "pass123"
    }
    response = requests.post(f"{BASE_URL}token/", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    access_token = response.json()["access"]
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # 2. Create a Manager
    manager_data = {
        "username": "manager_repro",
        "email": "manager_repro@test.com",
        "password": "managerpassword123",
        "role": "MANAGER",
        "branch": 3
    }
    requests.post(f"{BASE_URL}users/register/", json=manager_data, headers=headers)
    
    # 3. Login as manager
    login_data = {
        "username": "manager_repro",
        "password": "managerpassword123"
    }
    response = requests.post(f"{BASE_URL}token/", json=login_data)
    access_token = response.json()["access"]
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # 4. Try to create a baker with invalid role
    baker_data = {
        "username": "baker_invalid_role",
        "email": "baker_inv@test.com",
        "password": "password123",
        "role": "INVALID_ROLE",
        "branch": 3
    }
    
    response = requests.post(f"{BASE_URL}users/register/", json=baker_data, headers=headers)
    print(f"Create Baker Response ({response.status_code}):")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    test_manager_creates_baker()
