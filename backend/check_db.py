from sqlalchemy import create_engine, inspect
import os

# Explicitly point to the file in the current directory
DB_FILE = "attendance_final.db"
DATABASE_URL = f"sqlite:///{DB_FILE}"

if not os.path.exists(DB_FILE):
    print(f"ERROR: {DB_FILE} does not exist in {os.getcwd()}")
else:
    print(f"SUCCESS: {DB_FILE} found.")
    
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print("Tables found:", tables)
        
        if "users" in tables:
            print("Users table exists.")
        else:
            print("ERROR: Users table missing.")
            
    except Exception as e:
        print("Error inspecting DB:", e)
