from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Time
from sqlalchemy.orm import relationship
from database import Base
import datetime

# ... (User code remains same)

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True)
    department = Column(String(100))
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    attendance_records = relationship("Attendance", back_populates="subject")
    teacher = relationship("User", back_populates="subjects_taught")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    # email should be unique
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    # Roles: admin, teacher, student
    role = Column(Enum("admin", "teacher", "student"), default="student")
    
    # Detailed Fields
    employee_id = Column(String(50), nullable=True) # Teacher
    department = Column(String(100), nullable=True) # Both
    
    roll_number = Column(String(50), nullable=True) # Student
    course = Column(String(100), nullable=True) # Student
    year_semester = Column(String(50), nullable=True) # Student
    
    account_status = Column(Enum("active", "inactive"), default="active")

    # URL to the image stored in Supabase
    image_url = Column(String(255), nullable=True)
    
    # Face encoding stored as text (JSON string) for simplicity
    face_encoding = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship to attendance records
    attendance_records = relationship("Attendance", back_populates="user")
    subjects_taught = relationship("Subject", back_populates="teacher")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True) # Nullable for now to support old records or general attendance
    date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(Enum("present", "absent", "late"), default="present")
    
    user = relationship("User", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")



# Association Table for Student Enrollments
class StudentCourse(Base):
    __tablename__ = "student_courses"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
