import requests

def test_full_flow():
    base_url = "http://localhost:8000"
    
    # 1. Login
    print("Step 1: Logging in...")
    login_url = f"{base_url}/auth/login"
    payload = {
        "username": "admin@vbis.com",
        "password": "test"
    }
    
    try:
        response = requests.post(login_url, data=payload)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Login Failed: {response.text}")
            return
            
        token_data = response.json()
        access_token = token_data.get("access_token")
        print("Login Successful. Token received.")
        
        # 2. Get User Profile
        print("\nStep 2: Fetching /users/me ...")
        me_url = f"{base_url}/users/me"
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        me_response = requests.get(me_url, headers=headers)
        print(f"Profile Status: {me_response.status_code}")
        
        if me_response.status_code == 200:
            print(f"Profile Data: {me_response.json()}")
            print("\nSUCCESS: Full login flow works correctly on backend.")
        else:
            print(f"Profile Fetch Failed: {me_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_full_flow()
