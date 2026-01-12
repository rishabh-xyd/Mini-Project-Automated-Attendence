import requests

url = "http://localhost:8000/auth/login"
payload = {
    "username": "admin@vbis.com",
    "password": "test"
}

try:
    # FastAPI OAuth2PasswordRequestForm expects Form Data, NOT JSON
    print(f"Attempting login to {url} with {payload}...")
    response = requests.post(url, data=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        print("\nSUCCESS: Login successful! Token received.")
    else:
        print("\nFAILURE: Login failed.")

except Exception as e:
    print(f"Error: {e}")
