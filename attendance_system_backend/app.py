print("✅ THIS app.py FILE IS RUNNING")
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, HTMLResponse
import face_recognition
import cv2
import numpy as np
import os
import pickle
from datetime import datetime

app = FastAPI()

DB_PATH = "face_database"
ENCODING_FILE = "encodings/encodings.pkl"

os.makedirs(DB_PATH, exist_ok=True)
os.makedirs("encodings", exist_ok=True)

# Load encodings
if os.path.exists(ENCODING_FILE):
    with open(ENCODING_FILE, "rb") as f:
        known_encodings, known_names = pickle.load(f)
else:
    known_encodings, known_names = [], []


# ------------------------
# UTIL FUNCTION
# ------------------------
def read_image(file):
    image_bytes = np.frombuffer(file, np.uint8)
    image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


# ------------------------
# FACE RECOGNITION
# ------------------------
@app.post("/recognize")
async def recognize_face(file: UploadFile = File(...)):
    contents = await file.read()
    image = read_image(contents)

    locations = face_recognition.face_locations(image)
    encodings = face_recognition.face_encodings(image, locations)

    if not encodings:
        return JSONResponse({"success": False, "message": "No face detected"})

    face_encoding = encodings[0]
    matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.5)

    name = "Unknown"
    if True in matches:
        index = matches.index(True)
        name = known_names[index]

    return {
        "success": True,
        "name": name
    }


# ------------------------
# FACE ENROLLMENT
# ------------------------
@app.post("/enroll")
async def enroll_face(
    name: str = Form(...),
    file: UploadFile = File(...)
):
    contents = await file.read()
    image = read_image(contents)

    encodings = face_recognition.face_encodings(image)

    if not encodings:
        return JSONResponse({"success": False, "message": "No face detected"})

    face_encoding = encodings[0]

    # Save image
    person_dir = os.path.join(DB_PATH, name)
    os.makedirs(person_dir, exist_ok=True)

    img_path = os.path.join(person_dir, f"{datetime.now().timestamp()}.jpg")
    cv2.imwrite(img_path, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))

    # Save encoding
    known_encodings.append(face_encoding)
    known_names.append(name)

    with open(ENCODING_FILE, "wb") as f:
        pickle.dump((known_encodings, known_names), f)

    return {"success": True, "message": f"{name} enrolled successfully"}


# ------------------------
# FRONTEND
# ------------------------
# @app.get("/")
# def home():
#     with open("./static/index.html", "r") as f:
#         return HTMLResponse(f.read())

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))







@app.get("/hello")
def hello():
    return "HELLO WORKS"
@app.get("/check")
def check():
    return {"check": "route works"}
