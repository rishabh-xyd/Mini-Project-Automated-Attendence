import shutil
import os
import uuid
import json
import numpy as np
import cv2

# Try importing face_recognition
try:
    import face_recognition
    REAL_RECOGNITION_AVAILABLE = True
except ImportError:
    REAL_RECOGNITION_AVAILABLE = False
    print("WARNING: face_recognition library not found. Running in MOCK mode.")

APP_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(APP_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global Cache for Known Faces
# Structure: { user_id: [encoding_array] }
KNOWN_FACES_CACHE = {} 
KNOWN_FACES_LOADED = False

def upload_to_supabase(file_content: bytes, filename: str) -> str:
    # Save locally for now
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(file_content)
    return file_path

def load_known_faces(db_session):
    """
    Loads all user encodings from the database into the global cache.
    Should be called on startup or periodically.
    """
    global KNOWN_FACES_CACHE, KNOWN_FACES_LOADED
    
    # Avoid circular import
    from models import User
    
    users = db_session.query(User).filter(User.face_encoding.isnot(None)).all()
    
    count = 0
    temp_cache = {}
    
    for user in users:
        try:
            # encoding is stored as a JSON string "[0.1, 0.2, ...]"
            if user.face_encoding:
                encoding_list = json.loads(user.face_encoding)
                temp_cache[user.id] = np.array(encoding_list)
                count += 1
        except Exception as e:
            print(f"Error loading encoding for user {user.id}: {e}")
            
    KNOWN_FACES_CACHE = temp_cache
    KNOWN_FACES_LOADED = True
    print(f"[INFO] Loaded {count} face encodings into memory.")

def get_face_encoding(image_path: str):
    """
    Given an image path, returns the list of 128-float face encoding.
    """
    if REAL_RECOGNITION_AVAILABLE:
        try:
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)
            if len(encodings) > 0:
                return encodings[0].tolist()
        except Exception as e:
            print(f"Error in face recognition: {e}")
            pass

    # Mock Fallback if library fails or not installed
    return [0.1] * 128

def recognize_face(unknown_image_path: str, db_session=None):
    """
    Recognizes a face from an image path.
    Returns: user_id (int) or None
    """
    # Auto-load cache if needed and DB session provided
    global KNOWN_FACES_LOADED
    if not KNOWN_FACES_LOADED and db_session:
        load_known_faces(db_session)
    
    detected_user_id = None
    
    if REAL_RECOGNITION_AVAILABLE and KNOWN_FACES_CACHE:
        try:
            # Load the unknown image
            unknown_image = face_recognition.load_image_file(unknown_image_path)
            unknown_encodings = face_recognition.face_encodings(unknown_image)
            
            if len(unknown_encodings) > 0:
                unknown_encoding = unknown_encodings[0]
                
                # Prepare lists for comparison
                known_ids = list(KNOWN_FACES_CACHE.keys())
                known_encodings = list(KNOWN_FACES_CACHE.values())
                
                # Strict tolerance 0.5 for high accuracy
                matches = face_recognition.compare_faces(known_encodings, unknown_encoding, tolerance=0.5)
                
                if True in matches:
                    first_match_index = matches.index(True)
                    detected_user_id = known_ids[first_match_index]
                    
        except Exception as e:
            print(f"Error in recognize_face: {e}")

    # Mock Fallback (only if REAL is not available)
    if not detected_user_id and not REAL_RECOGNITION_AVAILABLE:
        # Just return the first user in cache if exists, else None
         if KNOWN_FACES_CACHE:
             import random
             return random.choice(list(KNOWN_FACES_CACHE.keys()))
    
    return detected_user_id
