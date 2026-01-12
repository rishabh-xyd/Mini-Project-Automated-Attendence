import models, database, auth
from sqlalchemy.orm import Session

db = database.SessionLocal()

try:
    print("Checking for admin user...")
    admin = db.query(models.User).filter(models.User.email == "admin@vbis.com").first()
    
    if admin:
        print(f"Admin found: ID={admin.id}, Email={admin.email}, Role={admin.role}")
        print(f"Password Hash in DB: {admin.password_hash}")
        
        # Test password verification
        is_valid = auth.verify_password("test", admin.password_hash)
        print(f"Password 'test' matches: {is_valid}")
        
        if not is_valid:
            print("Resetting password to 'test'...")
            admin.password_hash = auth.get_password_hash("test")
            db.commit()
            print("Password reset complete.")
        else:
             print("Password is correct.")
    else:
        print("Admin user NOT FOUND in database.")
        print("Creating admin user...")
        hashed_password = auth.get_password_hash("test")
        admin = models.User(
            email="admin@vbis.com",
            name="System Admin",
            password_hash=hashed_password,
            role="admin"
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully.")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
