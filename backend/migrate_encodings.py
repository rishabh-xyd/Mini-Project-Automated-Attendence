import os
import sys
try:
    import face_recognition
    REAL_LIB = True
except ImportError:
    REAL_LIB = False
    print("[WARN] face_recognition not found. Migration will skip encoding.")

import json
import numpy as np

# Ensure we can import from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User

def migrate_faces():
    db = SessionLocal()
    
    # Path to the external face database
    # Assuming the user's directory structure is:
    # root/
    #   backend/
    #   attendance_system_backend/
    #      face_database/
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    FACE_DB_PATH = os.path.join(BASE_DIR, "attendance_system_backend", "face_database")
    
    print(f"[INFO] Scanning for faces in: {FACE_DB_PATH}")
    
    if not os.path.exists(FACE_DB_PATH):
        print("[ERROR] Face database path not found!")
        return

    enrolled_count = 0

    # Walk through each person's folder
    for person_name in os.listdir(FACE_DB_PATH):
        person_folder = os.path.join(FACE_DB_PATH, person_name)
        
        if not os.path.isdir(person_folder):
            continue
            
        print(f"\n[PROCESSING] User: {person_name}")
        
        generated_email = f"{person_name.lower().replace(' ', '')}@student.com"
        
        # Check if user exists (Name case-insensitive OR Email)
        # SQLite matching for LIKE is case-insensitive by default for ASCII, but let's be safe
        user = db.query(User).filter(
            (User.email == generated_email) | (User.name == person_name)
        ).first()

        if not user:
            print(f"   -> Creating new user record for {person_name}")
            user = User(
                name=person_name,
                email=generated_email,
                password_hash="hashed_default_password", # In real app, hash this properly
                role="student",
                account_status="active"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print(f"   -> User record exists (ID: {user.id}, Name: {user.name})")
            
        # MOCK MODE CHECK (Apply immediately)
        if not REAL_LIB:
            if not user.face_encoding:
                print(f"   [MOCK] Forced generation of dummy encoding for {person_name}")
                dummy_encoding = [0.0] * 128
                user.face_encoding = json.dumps(dummy_encoding)
                db.commit()
                enrolled_count += 1
            else:
                 print(f"   [SKIP] User {person_name} already has encoding (or mock)")
            
            # Skip actual image processing in mock mode
            continue

        # Process Images to get Encoding (only need one good one)
        # We will pick the first valid face we find
        
        encoding_found = False
        
        for img_name in os.listdir(person_folder):
            if encoding_found: break
            
            img_path = os.path.join(person_folder, img_name)
            
            try:
                if not REAL_LIB:
                    # Mock Mode: Create user with dummy encoding if not exists
                    if not user.face_encoding:
                        print(f"   [MOCK] generating dummy encoding for {person_name}")
                        dummy_encoding = [0.0] * 128
                        user.face_encoding = json.dumps(dummy_encoding)
                        db.commit()
                        enrolled_count += 1
                        encoding_found = True
                    else:
                         print(f"   [SKIP] User {person_name} already has encoding (or mock)")
                         encoding_found = True
                    break # Only need one image to confirm "enrollment" in mock mode

                # Load and Encode
                image = face_recognition.load_image_file(img_path)
                encodings = face_recognition.face_encodings(image)
                
                if len(encodings) > 0:
                    # Found a face!
                    # Convert to list for JSON storage
                    encoding_list = encodings[0].tolist() 
                    
                    # Update User Record
                    user.face_encoding = json.dumps(encoding_list)
                    db.commit()
                    
                    print(f"   [SUCCESS] Encoded face from {img_name}")
                    enrolled_count += 1
                    encoding_found = True
                else:
                    print(f"   [WARN] No face found in {img_name}")
                    
            except Exception as e:
                print(f"   [ERROR] Failed to process {img_name}: {e}")

    print(f"\n[DONE] Migration complete. Enrolled {enrolled_count} users into SQL Database.")
    db.close()

if __name__ == "__main__":
    try:
        migrate_faces()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[FATAL ERROR] {e}")
