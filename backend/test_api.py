import requests
import json

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@vbis.com"
ADMIN_PASSWORD = "test"

def test_flow():
    # 1. Login
    print("1. Logging in...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if resp.status_code != 200:
            print(f"Login Failed: {resp.text}")
            return
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   Login Success!")
    except Exception as e:
        print(f"Server might be down: {e}")
        return

    # 2. Create Student with Detailed Fields
    print("\n2. Creating Student with Detailed Fields...")
    student_payload = {
        "name": "API Test Student",
        "email": "apiteststudent@vbis.com",
        "password": "password123",
        "role": "student",
        "roll_number": "API-ROLL-001",
        "department": "CS",
        "course": "B.Tech API",
        "year_semester": "1st Year"
    }
    
    resp = requests.post(f"{BASE_URL}/admin/users", json=student_payload, headers=headers)
    if resp.status_code == 200:
        print("   Create Student Success!")
        print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    else:
        print(f"   Create Student FAILED: {resp.status_code} - {resp.text}")

    # 3. Create Teacher with Detailed Fields
    print("\n3. Creating Teacher with Detailed Fields...")
    teacher_payload = {
        "name": "API Test Teacher",
        "email": "apitestteacher@vbis.com",
        "password": "password123",
        "role": "teacher",
        "employee_id": "API-EMP-001",
        "department": "CS"
    }
    
    resp = requests.post(f"{BASE_URL}/admin/users", json=teacher_payload, headers=headers)
    if resp.status_code == 200:
        print("   Create Teacher Success!")
        print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    else:
        print(f"   Create Teacher FAILED: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    test_flow()
