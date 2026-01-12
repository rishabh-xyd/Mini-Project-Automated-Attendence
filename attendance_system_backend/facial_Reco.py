import os
import cv2
import face_recognition
import pickle

# -----------------------------
# STEP 1: Load & encode faces
# -----------------------------

KNOWN_ENCODINGS = []
KNOWN_NAMES = []

FACE_DB_PATH = "face_database"

print("[INFO] Loading face database...")

for person_name in os.listdir(FACE_DB_PATH):
    person_folder = os.path.join(FACE_DB_PATH, person_name)

    if not os.path.isdir(person_folder):
        continue

    for img_name in os.listdir(person_folder):
        img_path = os.path.join(person_folder, img_name)

        try:
            image = face_recognition.load_image_file(img_path)
            encodings = face_recognition.face_encodings(image)

            if len(encodings) > 0:
                KNOWN_ENCODINGS.append(encodings[0])
                KNOWN_NAMES.append(person_name)
                print(f"[OK] Encoded {person_name} - {img_name}")
            else:
                print(f"[WARN] No face found in {img_path}")

        except Exception as e:
            print(f"[ERROR] {img_path}: {e}")

print("[INFO] Face encoding completed.")

# -----------------------------
# STEP 2: Start webcam
# -----------------------------

cap = cv2.VideoCapture(0)

print("[INFO] Starting camera. Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Camera not accessible")
        break

    # Resize for speed
    small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
    rgb_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    for face_encoding, face_location in zip(face_encodings, face_locations):
        matches = face_recognition.compare_faces(KNOWN_ENCODINGS, face_encoding, tolerance=0.5)
        name = "Unknown"

        if True in matches:
            matched_index = matches.index(True)
            name = KNOWN_NAMES[matched_index]

        top, right, bottom, left = face_location
        top *= 2
        right *= 2
        bottom *= 2
        left *= 2

        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
        cv2.putText(
            frame,
            name,
            (left, top - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2
        )

    cv2.imshow("Facial Attendance System", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
