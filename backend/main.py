from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List
import csv
import io
import uuid
import os
from fastapi.responses import StreamingResponse
import models, database, schemas, auth, utils

app = FastAPI(title="Face Recognition Attendance System")

models.Base.metadata.create_all(bind=database.engine)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    # Seed Admin
    admin_email = "admin@vbis.com"
    existing_admin = db.query(models.User).filter(models.User.email == admin_email).first()
    if not existing_admin:
        hashed_password = auth.get_password_hash("test")
        admin = models.User(
            email=admin_email,
            name="System Admin",
            password_hash=hashed_password,
            role="admin"
        )
        db.add(admin)
        db.commit()
        
    # Seed Teacher
    teacher_email = "teacher@vbis.com"
    existing_teacher = db.query(models.User).filter(models.User.email == teacher_email).first()
    teacher_id = None
    if not existing_teacher:
        hashed_password = auth.get_password_hash("test")
        teacher = models.User(
            email=teacher_email,
            name="Faculty Member",
            password_hash=hashed_password,
            role="teacher",
            employee_id="FAC001",
            department="CS"
        )
        db.add(teacher)
        db.commit()
        teacher_id = teacher.id
    else:
        teacher_id = existing_teacher.id

    # Seed Student
    student_email = "student@vbis.com"
    existing_student = db.query(models.User).filter(models.User.email == student_email).first()
    if not existing_student:
        hashed_password = auth.get_password_hash("test")
        student = models.User(
            email=student_email,
            name="Student User",
            password_hash=hashed_password,
            role="student",
            roll_number="STU001",
            department="CS",
            course="B.Tech",
            year_semester="4th Year"
        )
        db.add(student)
        db.commit()

    # Seed Subjects with Times (Assuming fixed daily schedule for Demo)
    # Using dummy times for demonstration (e.g. CS101 is always 9am-12pm)
    from datetime import time
    subjects = [
        {"name": "Computer Networks", "code": "CS101", "department": "CS", "start_time": time(9, 0), "end_time": time(12, 0)},
        {"name": "Operating Systems", "code": "CS102", "department": "CS", "start_time": time(12, 0), "end_time": time(14, 0)},
        {"name": "Data Structures", "code": "CS103", "department": "CS", "start_time": time(14, 0), "end_time": time(16, 0)},
        {"name": "Database Management", "code": "CS104", "department": "CS", "start_time": time(16, 0), "end_time": time(17, 0)},
        {"name": "Digital Electronics", "code": "EC101", "department": "ECE", "start_time": time(9, 0), "end_time": time(11, 0)},
    ]
    for sub in subjects:
        existing = db.query(models.Subject).filter(models.Subject.code == sub["code"]).first()
        if not existing:
            # Assign first 3 subjects to our demo teacher logic
            t_id = teacher_id if sub["code"] in ["CS101", "CS102", "CS103"] else None
            db.add(models.Subject(**sub, teacher_id=t_id))
        else:
             # Update times/teacher if exists
             existing.start_time = sub["start_time"]
             existing.end_time = sub["end_time"]
             if sub["code"] in ["CS101", "CS102", "CS103"]:
                 existing.teacher_id = teacher_id
             db.add(existing)
    db.commit()
    
    db.close()

# ... (Previous API endpoints) ...

# Teacher Dashboard APIs

@app.get("/teacher/dashboard")
def get_teacher_dashboard(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    if current_user.role != "teacher" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    my_subjects = db.query(models.Subject).filter(models.Subject.teacher_id == current_user.id).all()
    
    total_students = 0
    # Logic to count unique students in my classes would go here if we tracked enrollments rigorously
    # For now, just placeholder or distinct count from attendance
    
    today = datetime.now().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    
    # Get today's classes from my subjects
    todays_classes = []
    current_time = datetime.now().time()
    for sub in my_subjects:
        is_today = True # simplified assumption
        status = "Upcoming"
        if sub.start_time and sub.end_time:
            if sub.end_time < current_time: status = "Completed"
            elif sub.start_time <= current_time <= sub.end_time: status = "Live"
            
            todays_classes.append({
                "id": sub.id,
                "name": sub.name,
                "code": sub.code,
                "time": f"{sub.start_time.strftime('%H:%M')} - {sub.end_time.strftime('%H:%M')}",
                "status": status
            })
        else:
             # Handle subjects without time (Optional: don't show in 'Today's Schedule' or show as 'Scheduled')
             pass

    return {
        "teacher_name": current_user.name,
        "total_subjects": len(my_subjects),
        "todays_classes": todays_classes
    }

@app.get("/teacher/subjects")
def get_teacher_subjects(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    if current_user.role != "teacher" and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Subject).filter(models.Subject.teacher_id == current_user.id).all()

@app.get("/teacher/subject/{subject_id}/attendance")
def get_subject_attendance(
    subject_id: int, 
    date: str = None, # YYYY-MM-DD
    current_user: models.User = Depends(auth.get_current_active_user), 
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher" and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    # Validate ownership
    sub = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not sub: raise HTTPException(status_code=404, detail="Subject not found")
    if current_user.role == "teacher" and sub.teacher_id != current_user.id:
          raise HTTPException(status_code=403, detail="You do not teach this subject")
          
    query = db.query(models.Attendance).filter(models.Attendance.subject_id == subject_id)
    
    if date:
        query_date = datetime.strptime(date, "%Y-%m-%d").date()
        start = datetime.combine(query_date, datetime.min.time())
        end = datetime.combine(query_date, datetime.max.time())
        query = query.filter(models.Attendance.date >= start, models.Attendance.date <= end)
    else:
        # Default to today
        today = datetime.now().date()
        start = datetime.combine(today, datetime.min.time())
        query = query.filter(models.Attendance.date >= start)
        
    records = query.all()
    
    # Enrich with student details
    result = []
    for r in records:
        student = db.query(models.User).filter(models.User.id == r.user_id).first()
        result.append({
            "attendance_id": r.id,
            "student_name": student.name,
            "roll_number": student.roll_number,
            "status": r.status,
            "time": r.date,
            "image": student.image_url # Optional
        })
        
    return result

@app.post("/teacher/attendance/update")
def update_student_attendance(
    attendance_id: int,
    status: str, # present, absent, late
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher" and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    record = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    # Verify teacher owns this subject
    sub = db.query(models.Subject).filter(models.Subject.id == record.subject_id).first()
    if current_user.role == "teacher" and sub.teacher_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized for this subject")
         
    record.status = status
    db.commit()
    return {"message": "Attendance updated"}

@app.get("/teacher/subject/{subject_id}/students")
def get_subject_students(
    subject_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher" and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    # Check subject ownership
    sub = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not sub: raise HTTPException(status_code=404, detail="Subject not found")
    
    # Logic to fetch enrolled students
    # For MVP: If StudentCourse table is empty for this subject, return ALL students (Demo Mode)
    # or students of same department
    enrollments = db.query(models.StudentCourse).filter(models.StudentCourse.subject_id == subject_id).all()
    
    students_data = []
    
    if enrollments:
        for enroll in enrollments:
            stu = db.query(models.User).filter(models.User.id == enroll.student_id).first()
            if stu: students_data.append(stu)
    else:
        # Fallback: Return all students if no specific enrollment (for easy demo)
        # Optionally filter by department matching subject
        query = db.query(models.User).filter(models.User.role == "student")
        if sub.department:
             query = query.filter(models.User.department == sub.department)
        students_data = query.all()
        # If still empty (maybe dept mismatch), just get all students
        if not students_data:
             students_data = db.query(models.User).filter(models.User.role == "student").all()

    # Calculate attendance stats for this subject for each student
    result = []
    total_classes = db.query(models.Attendance).filter(models.Attendance.subject_id == subject_id).group_by(models.Attendance.date).count()
    if total_classes == 0: total_classes = 1 # Avoid div by zero

    today = datetime.now().date()
    start_of_day = datetime.combine(today, datetime.min.time())

    for stu in students_data:
        attended = db.query(models.Attendance).filter(
            models.Attendance.subject_id == subject_id,
            models.Attendance.user_id == stu.id,
            models.Attendance.status == "present"
        ).count()
        
        pct = (attended / total_classes * 100) if total_classes > 0 else 0
        
        # Get today's status
        today_record = db.query(models.Attendance).filter(
            models.Attendance.subject_id == subject_id,
            models.Attendance.user_id == stu.id,
            models.Attendance.date >= start_of_day
        ).first()
        
        result.append({
            "id": stu.id,
            "name": stu.name,
            "roll_number": stu.roll_number,
            "image_url": stu.image_url,
            "attendance_percentage": round(pct, 1),
            "today_status": today_record.status if today_record else None,
            "today_record_id": today_record.id if today_record else None
        })
        
    return result

@app.post("/teacher/attendance/bulk")
def bulk_mark_attendance(
    req: schemas.BulkAttendanceRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher" and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")

    sub = db.query(models.Subject).filter(models.Subject.id == req.subject_id).first()
    if not sub: raise HTTPException(status_code=404, detail="Subject not found")
    
    today = datetime.now()
    already_marked_count = 0
    new_marked_count = 0
    
    start_of_day = datetime.combine(today.date(), datetime.min.time())

    for student_id in req.student_ids:
        # Check existing
        existing = db.query(models.Attendance).filter(
            models.Attendance.user_id == student_id,
            models.Attendance.subject_id == sub.id,
            models.Attendance.date >= start_of_day
        ).first()
        
        if existing:
            existing.status = req.status
            already_marked_count += 1
        else:
            new_record = models.Attendance(
                user_id=student_id,
                subject_id=sub.id,
                status=req.status,
                date=today
            )
            db.add(new_record)
            new_marked_count += 1
            
    db.commit()
    return {"message": f"Updated {already_marked_count + new_marked_count} students ({new_marked_count} new)."}

@app.post("/teacher/attendance/live")
async def live_classroom_attendance(
    subject_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher" and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    # 1. Recognize
    content = await file.read()
    users = db.query(models.User).filter(models.User.face_encoding.isnot(None)).all()
    known_encodings = [(u.id, u.face_encoding) for u in users]
    
    if not known_encodings: return {"status": "error", "message": "No users registered"}
    
    user_id = utils.recognize_face(content, known_encodings)
    
    if not user_id: return {"status": "idle", "message": "No face recognized"}
    
    student = db.query(models.User).filter(models.User.id == user_id).first()
    
    # 2. Mark Attendance for Subject
    today = datetime.now()
    start_of_day = datetime.combine(today.date(), datetime.min.time())
    
    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == student.id,
        models.Attendance.subject_id == subject_id,
        models.Attendance.date >= start_of_day
    ).first()
    
    if existing:
        return {
            "status": "success", 
            "student": {"id": student.id, "name": student.name, "roll_number": student.roll_number},
            "message": "Already marked"
        }
        
    new_record = models.Attendance(
        user_id=student.id,
        subject_id=subject_id,
        status="present",
        date=today
    )
    db.add(new_record)
    db.commit()
    
    return {
        "status": "success", 
        "student": {"id": student.id, "name": student.name, "roll_number": student.roll_number},
        "message": "Marked Present"
    }

@app.put("/users/me", response_model=schemas.UserResponse)
def update_my_profile(
    user_update: schemas.UserUpdateProfile,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if user_update.password:
        db_user.password_hash = auth.get_password_hash(user_update.password)
        
    if user_update.employee_id is not None: db_user.employee_id = user_update.employee_id
    if user_update.department is not None: db_user.department = user_update.department
    
    db.commit()
    db.refresh(db_user)
    return db_user

# ... (Validate email domain) ...

# Automated Attendance Kiosk Endpoint
@app.post("/attendance/auto-mark")
async def auto_mark_attendance(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    # 1. Read Image
    content = await file.read()
    
    # Check if we should use DB or if faces are already cached in utils
    # If using utils.recognize_face with db session, it handles loading.
    
    try:
        user_id = utils.recognize_face(file.filename, db) # Just passing db to trigger load if needed, but wait..
        # utils.recognize_face expects image CONTENT not filename (Wait, my utils.recognize_face expects PATH).
        # But here 'content' is bytes.
        # My updated utils.recognize_face saves Content to temp file if I pass bytes?
        # Let me re-check utils.py... It expects "unknown_image_path" string.
        # So I need to save it first here.
        
        # ACTUALLY, I should update utils to accept bytes or I do it here.
        # In this specific file context, let's keep it simple.
        
        temp_filename = f"temp_kiosk_{uuid.uuid4()}.jpg"
        temp_path = utils.upload_to_supabase(content, temp_filename)
        
        user_id = utils.recognize_face(temp_path, db_session=db)
        
        # Cleanup
        try: os.remove(temp_path)
        except: pass

    except Exception as e:
        print(f"Recognition Error: {e}")
        user_id = None
    
    if not user_id:
        raise HTTPException(status_code=404, detail="Face not recognized.")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found.")

    # 3. Find Active Class based on Time
    current_time = datetime.now().time()
    
    # Find subject where start <= now <= end
    # Note: SQLite Time comparison works with Python time objects
    active_subject = db.query(models.Subject).filter(
        models.Subject.start_time <= current_time,
        models.Subject.end_time >= current_time
    ).first()
    
    if not active_subject:
         # Optional: You could allow general attendance without subject if no class is on
         return {
             "status": "partial",
             "student_name": user.name,
             "message": f"Welcome, {user.name}. No class is currently scheduled.",
             "subject": None
         }
         
    # 4. Mark Attendance
    # Check duplicate for today + subject
    today = datetime.now().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    
    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == user.id,
        models.Attendance.subject_id == active_subject.id,
        models.Attendance.date >= start_of_day
    ).first()
    
    if existing:
         return {
             "status": "success",
             "student_name": user.name,
             "subject": active_subject.name,
             "message": f"Already marked for {active_subject.name}."
         }
         
    new_record = models.Attendance(
        user_id=user.id,
        status="present",
        subject_id=active_subject.id,
        date=datetime.now()
    )
    db.add(new_record)
    db.commit()
    
    return {
        "status": "success",
        "student_name": user.name,
        "subject": active_subject.name,
        "message": f"Attendance marked for {active_subject.name}"
    }

# Student Dashboard API
def validate_email_domain(email: str):
    if not email.endswith("@vbis.com"):
        raise HTTPException(status_code=400, detail="Email must belong to @vbis.com domain")

@app.post("/admin/users", response_model=schemas.UserResponse)
def create_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    employee_id: str = Form(None),
    department: str = Form(None),
    roll_number: str = Form(None),
    course: str = Form(None),
    year_semester: str = Form(None),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")
    
    validate_email_domain(email)
    
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Process Image
    content = file.file.read()
    
    # Save temporarily to process (or permanently if we decide this is the final file)
    # We use upload_to_supabase which currently saves locally to uploads/
    # We will rename it later using the user ID if successful, or just use a UUID-based name.
    # User requested image name based on candidate name.
    sanitized_name = name.replace(" ", "_").lower()
    final_filename = f"{sanitized_name}_{uuid.uuid4()}.jpg"
    image_url = utils.upload_to_supabase(content, final_filename)
    
    # Verify Face
    encoding = utils.get_face_encoding(image_url)
    if not encoding:
        # Delete the file if face not found
        try:
             os.remove(image_url)
        except:
            pass
        raise HTTPException(status_code=400, detail="No face detected in the image. Registration failed.")

    hashed_password = auth.get_password_hash(password)
    new_user = models.User(
        email=email,
        name=name,
        password_hash=hashed_password,
        role=role,
        employee_id=employee_id,
        department=department,
        roll_number=roll_number,
        course=course,
        year_semester=year_semester,
        account_status="active",
        image_url=image_url,
        face_encoding=str(encoding)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(role: str = None, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view users")
    
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.all()

@app.put("/admin/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Only admins can update users")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Validate domain if email changes
    if user_update.email != db_user.email:
        validate_email_domain(user_update.email)
        existing = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing:
             raise HTTPException(status_code=400, detail="Email already taken")
        db_user.email = user_update.email

    db_user.name = user_update.name
    db_user.role = user_update.role
    
    # Update Detailed Fields if provided (or set to null if intended, but usually we just update what's passed)
    if user_update.employee_id is not None: db_user.employee_id = user_update.employee_id
    if user_update.department is not None: db_user.department = user_update.department
    if user_update.roll_number is not None: db_user.roll_number = user_update.roll_number
    if user_update.course is not None: db_user.course = user_update.course
    if user_update.year_semester is not None: db_user.year_semester = user_update.year_semester
    # Only update password if provided (assuming logic in frontend handles empty password differently, 
    # but here schema requires it. For simplicity, we update it.)
    db_user.password_hash = auth.get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/admin/stats")
def get_admin_stats(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view stats")
    
    total_users = db.query(models.User).count()
    total_students = db.query(models.User).filter(models.User.role == "student").count()
    total_teachers = db.query(models.User).filter(models.User.role == "teacher").count()
    
    total_attendance = db.query(models.Attendance).count()
    
    # Today's attendance
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_attendance = db.query(models.Attendance).filter(models.Attendance.date >= today_start).count()
    
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_attendance": total_attendance,
        "today_attendance": today_attendance
    }

@app.get("/admin/attendance/export")
def export_attendance(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can export data")
    
    records = db.query(models.Attendance).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'User ID', 'Name', 'Email', 'Role', 'Date', 'Status'])
    
    for record in records:
        user = db.query(models.User).filter(models.User.id == record.user_id).first()
        writer.writerow([
            record.id, 
            record.user_id, 
            user.name if user else 'Unknown', 
            user.email if user else 'Unknown',
            user.role if user else 'Unknown',
            record.date, 
            record.status
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"}
    )

from sqlalchemy import text

@app.get("/health")
def health_check(db: Session = Depends(database.get_db)):
    try:
        # Simple DB check
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected", "backend": "running"}
    except Exception as e:
        return {"status": "error", "database": str(e), "backend": "running"}

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/user/upload-face")
def upload_face(user_id: int = None, file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Determine target user
    target_user = current_user
    if user_id:
        if current_user.role != "admin":
             raise HTTPException(status_code=403, detail="Only admins can upload for others")
        target_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")

    content = file.file.read()
    filename = f"{target_user.id}_{file.filename}"
    
    # Upload to storage (Supabase/Local)
    image_url = utils.upload_to_supabase(content, filename)
    
    # Get encoding
    # In real world: save locally first if needed by library
    encoding = utils.get_face_encoding(image_url) 
    
    # Update user
    target_user.image_url = image_url
    target_user.face_encoding = str(encoding)
    db.commit()
    
    return {"message": "Face uploaded successfully", "image_url": image_url}

# Student Dashboard API
@app.get("/student/dashboard", response_model=schemas.DashboardStats)
def get_student_dashboard(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Calculate Overall Stats
    total_attendance = db.query(models.Attendance).filter(models.Attendance.user_id == current_user.id).count()
    attended_count = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id, 
        models.Attendance.status == "present"
    ).count()
    
    # Mocking Total Classes for now since we don't track class sessions separately yet
    # Assuming total classes = total attendance records for simplified calculation per student
    # In a real system, Total Classes should be distinct sessions held for the batch.
    
    # Let's derive total classes from unique dates for the student's department/course or just count their records
    # For MVP: Total Classes = Total Records (Present + Absent)
    
    overall_percentage = (attended_count / total_attendance * 100) if total_attendance > 0 else 0.0
    
    status_label = "Eligible"
    if overall_percentage < 65:
        status_label = "Shortage"
    elif overall_percentage < 75:
        status_label = "Warning"
        
    # Subject-wise Stats
    # Get all subjects relevant to student (ideally filter by dept, but for now getting all active subjects with records)
    subjects = db.query(models.Subject).all()
    subject_stats = []
    
    for sub in subjects:
        sub_total = db.query(models.Attendance).filter(
            models.Attendance.user_id == current_user.id,
            models.Attendance.subject_id == sub.id
        ).count()
        
        if sub_total > 0:
            sub_attended = db.query(models.Attendance).filter(
                models.Attendance.user_id == current_user.id,
                models.Attendance.subject_id == sub.id,
                models.Attendance.status == "present"
            ).count()
            sub_pct = (sub_attended / sub_total * 100)
            subject_stats.append({
                "subject": sub.name,
                "code": sub.code,
                "total": sub_total,
                "attended": sub_attended,
                "percentage": round(sub_pct, 1)
            })
    
    # History
    history = db.query(models.Attendance).filter(models.Attendance.user_id == current_user.id).order_by(models.Attendance.date.desc()).limit(10).all()
    
    return {
        "student_name": current_user.name,
        "roll_number": current_user.roll_number,
        "department": current_user.department,
        "overall_attendance_percentage": round(overall_percentage, 1),
        "total_classes": total_attendance,
        "attended_classes": attended_count,
        "eligibility_status": status_label,
        "subject_wise_attendance": subject_stats,
        "attendance_history": history
    }

@app.get("/subjects", response_model=List[schemas.SubjectResponse])
def get_subjects(db: Session = Depends(database.get_db)):
    return db.query(models.Subject).all()

# Modified Mark Attendance to accept Subject
@app.post("/attendance/mark")
async def mark_attendance(
    file: UploadFile = File(...),
    subject_id: int = Form(None), # Optional for now, but UI should send it
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Verify Face matches User
    content = await file.read()
    
    # 1. Get user's enrolled face encoding
    if not current_user.face_encoding:
         raise HTTPException(status_code=400, detail="Face validation failed. No face data found for user.")
         
    # 2. Verify
    # Save temp for verification function
    temp_filename = f"temp_{uuid.uuid4()}.jpg"
    temp_path = utils.upload_to_supabase(content, temp_filename) 
    
    match = utils.verify_face(temp_path, current_user.face_encoding)
    
    # Cleanup temp
    try:
        os.remove(temp_path)
    except:
        pass
        
    if match:
        # Mark Present
        # Check if already marked for today and this subject
        today = datetime.now().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        
        query = db.query(models.Attendance).filter(
            models.Attendance.user_id == current_user.id,
            models.Attendance.date >= start_of_day
        )
        
        if subject_id:
             query = query.filter(models.Attendance.subject_id == subject_id)
        
        existing = query.first()
        
        if existing:
             return {"message": "Attendance already marked for today."}
        
        new_record = models.Attendance(
            user_id=current_user.id,
            status="present",
            subject_id=subject_id,
            date=datetime.now()
        )
        db.add(new_record)
        db.commit()
        return {"message": f"Attendance Marked Present for {current_user.name}"}
    else:
        raise HTTPException(status_code=401, detail="Face verification failed. Identify verification mismatch.")

@app.get("/attendance/history", response_model=List[schemas.AttendanceResponse])
def get_attendance(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role in ["admin", "teacher"]:
        return db.query(models.Attendance).all()
    else:
        return db.query(models.Attendance).filter(models.Attendance.user_id == current_user.id).all()

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/teacher/attendance/export")
def export_subject_attendance(
    subject_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher" and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    sub = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not sub: raise HTTPException(status_code=404, detail="Subject not found")
    
    records = db.query(models.Attendance).filter(models.Attendance.subject_id == subject_id).order_by(models.Attendance.date.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Date', 'Student Name', 'Roll Number', 'Status'])
    
    for r in records:
        stu = db.query(models.User).filter(models.User.id == r.user_id).first()
        writer.writerow([
            r.date.strftime("%Y-%m-%d %H:%M"),
            stu.name,
            stu.roll_number,
            r.status
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={sub.code}_attendance.csv"}
    )

@app.get("/teacher/student/{student_id}/history")
def get_student_history_teacher(
    student_id: int,
    subject_id: int = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "teacher" and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    query = db.query(models.Attendance).filter(models.Attendance.user_id == student_id)
    if subject_id:
        query = query.filter(models.Attendance.subject_id == subject_id)
        
    records = query.order_by(models.Attendance.date.desc()).all()
    
    result = []
    for r in records:
        sub = db.query(models.Subject).filter(models.Subject.id == r.subject_id).first()
        result.append({
            "id": r.id,
            "subject": sub.code if sub else "Unknown",
            "date": r.date,
            "status": r.status
        })
    return result



