import pickle
import os

pkl_path = "attendance_system_backend/encodings/encodings.pkl"

if os.path.exists(pkl_path):
    try:
        with open(pkl_path, "rb") as f:
            data = pickle.load(f)
        print("Pickle Loaded Successfully")
        print("Type:", type(data))
        if isinstance(data, tuple):
            print(f"Tuple Length: {len(data)}")
            for i, item in enumerate(data):
                print(f"Item {i} Type: {type(item)}")
                if isinstance(item, list):
                    print(f"Item {i} Length: {len(item)}")
                    if len(item) > 0:
                        print(f"Item {i} Sample[0]: {item[0]}")
    except Exception as e:
        print("Error loading pickle:", e)
else:
    print("Pickle file not found at", pkl_path)
