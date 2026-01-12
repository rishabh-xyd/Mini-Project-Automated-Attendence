import sys
import os
import json
import sqlite3

# Adjust path to backend
sys.path.append(os.path.join(os.getcwd(), 'backend'))

DB_PATH = "backend/attendance_final.db"

def check_system():
    print("=== SYSTEM VERIFICATION ===")
    
    # 1. Check Library Status
    try:
        import face_recognition
        print("[LIBRARY] face_recognition: INSTALLED (Real Mode Available)")
    except ImportError:
        print("[LIBRARY] face_recognition: MISSING (Using Mock Mode)")

    # 2. Check Database
    if not os.path.exists(DB_PATH):
        print(f"[DATABASE] ERROR: {DB_PATH} not found!")
        return
        
    print(f"[DATABASE] Found {DB_PATH}")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check Users
        cursor.execute("SELECT id, name, role, face_encoding FROM users")
        users = cursor.fetchall()
        print(f"[DATA] Total Users: {len(users)}")
        
        mock_encodings = 0
        real_encodings = 0
        students = 0
        
        for u in users:
            uid, name, role, enc = u
            if role == 'student': students += 1
            
            if enc:
                try:
                    parsed = json.loads(enc)
                    # Check if it's our mock [0.0]*128
                    if sum(parsed) == 0 and len(parsed) == 128:
                        mock_encodings += 1
                        print(f"   -> User '{name}' has MOCK encoding.")
                    else:
                        real_encodings += 1
                        print(f"   -> User '{name}' has REAL/Other encoding.")
                except:
                    print(f"   -> User '{name}' has INVALID encoding format.")
            else:
                print(f"   -> User '{name}' has NO encoding.")
                
        print(f"[SUMMARY] Students: {students}, Mock Encodings: {mock_encodings}, Real Encodings: {real_encodings}")
        
    except Exception as e:
        print(f"[DATABASE] Error inspecting data: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    check_system()
