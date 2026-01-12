from fpdf import FPDF
import datetime

class PDF(FPDF):
    def header(self):
        # Logo placeholder
        # self.image('logo.png', 10, 8, 33)
        self.set_font('Arial', 'B', 15)
        self.cell(80)
        self.cell(30, 10, 'Automated Attendance System', 0, 0, 'C')
        self.ln(20)
        self.line(10, 30, 200, 30)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, 'Page ' + str(self.page_no()) + '/{nb}', 0, 0, 'C')

    def chapter_title(self, num, label):
        self.set_font('Arial', 'B', 12)
        self.set_fill_color(200, 220, 255)
        self.cell(0, 6, '%s' % (label), 0, 1, 'L', 1)
        self.ln(4)

    def chapter_body(self, body):
        self.set_font('Arial', '', 11)
        self.multi_cell(0, 5, body)
        self.ln()

    def bullet_point(self, text):
        self.set_font('Arial', '', 11)
        self.cell(5)
        self.cell(0, 5, chr(149) + ' ' + text, ln=1)
    
    def section_header(self, text):
         self.set_font('Arial', 'B', 11)
         self.ln(2)
         self.cell(0, 5, text, ln=1)
         self.ln(2)

pdf = PDF()
pdf.alias_nb_pages()
pdf.add_page()
pdf.set_title('Automated Attendance System Documentation')

# 1. Executive Summary
pdf.chapter_title(1, '1. Executive Summary')
pdf.chapter_body(
    "The Automated Attendance System is a comprehensive, role-based platform designed to modernize "
    "academic attendance tracking. Utilizing advanced Face Recognition technology, the system enables "
    "touch-free, automated attendance marking for students, while providing powerful dashboards for "
    "Faculty and Administrators to manage courses, view real-time logs, and generate detailed reports."
)

# 2. System Architecture
pdf.chapter_title(2, '2. System Architecture')
pdf.chapter_body(
    "The system follows a modern Client-Server architecture, separating the User Interface (Frontend) "
    "from the Business Logic and Data Management (Backend)."
)
pdf.section_header("Frontend (Client Side)")
pdf.bullet_point("Framework: React.js (v19) with Vite (v7)")
pdf.bullet_point("Styling: Tailwind CSS (v4)")
pdf.bullet_point("State Management: React Context API")
pdf.bullet_point("HTTP Client: Axios")
pdf.bullet_point("Features: SAP (Single Page Application), Split-screen Kiosk Mode, Responsive Dashboards")

pdf.section_header("Backend (Server Side)")
pdf.bullet_point("Framework: FastAPI (Python)")
pdf.bullet_point("Server: Uvicorn (ASGI)")
pdf.bullet_point("AI Engine: face_recognition (Dlib/OpenCV based)")
pdf.bullet_point("Authentication: OAuth2 with JWT (JSON Web Tokens)")

pdf.section_header("Database")
pdf.bullet_point("Type: Relational Database")
pdf.bullet_point("ORM: SQLAlchemy")
pdf.bullet_point("Engine: SQLite (Development/MVP), Compatible with MySQL/PostgreSQL")

# 3. Detailed Technology Stack
pdf.chapter_title(3, '3. Detailed Technology Stack')
pdf.section_header("Core Libraries & Versions")
pdf.bullet_point("Python: 3.x")
pdf.bullet_point("FastAPI: Latest")
pdf.bullet_point("React: v19.2.0")
pdf.bullet_point("OpenCV-Python: Computer Vision operations")
pdf.bullet_point("NumPy: Matrix operations for face encodings")
pdf.bullet_point("Lucide-React: Modern Iconography")

# 4. Database Schema Design
pdf.chapter_title(4, '4. Database Schema')
pdf.chapter_body(
    "The database is normalized to support role-based access and course-specific tracking."
)
pdf.section_header("Users Table")
pdf.chapter_body("Stores all actors (Admin, Teacher, Student). Key columns: role, email, password_hash, face_encoding, department.")

pdf.section_header("Subjects Table")
pdf.chapter_body("Stores course details. Key columns: name, code, start_time, end_time, teacher_id.")

pdf.section_header("Attendance Table")
pdf.chapter_body("Transactional table for logs. Key columns: user_id, subject_id, date, status (present/absent/late).")

pdf.section_header("StudentCourse Table")
pdf.chapter_body("Many-to-Many link between Students and Subjects (Enrollments).")

# 5. Key Features & Modules
pdf.chapter_title(5, '5. Key Modules')

pdf.section_header("A. Smart Kiosk (Public Interface)")
pdf.chapter_body(
    "A split-screen interface located at classroom entrances. \n"
    "- Left Panel: Continuously scans for faces. If a registered student is recognized, it checks their schedule and marks attendance automatically.\n"
    "- Right Panel: Secure login portal for Staff and Admins."
)

pdf.section_header("B. Faculty Portal")
pdf.chapter_body(
    "- Live Classroom: Real-time monitoring of class attendance via webcam.\n"
    "- Roster Management: View student lists, Bulk Mark attendance, Edit status.\n"
    "- Analytics: Attendance percentages and exportable CSV reports."
)

pdf.section_header("C. Administrative Dashboard")
pdf.chapter_body(
    "- User Management: CRUD operations for Students and Teachers.\n"
    "- Face Enrollment: Upload and process reference images for users.\n"
    "- System Stats: Global overview of attendance and user base."
)

# 6. Security Implementation
pdf.chapter_title(6, '6. Security Implementation')
pdf.bullet_point("Password Hashing: Bcrypt")
pdf.bullet_point("Token Authorization: Bearer JWT with expiration")
pdf.bullet_point("Role-Based Access Control (RBAC): Middleware checks for 'admin' or 'teacher' scopes before executing sensitive APIs.")
pdf.bullet_point("CORS Policy: Configured for secure frontend-backend communication.")

# Output
pdf_output_path = "Project_Documentation.pdf"
pdf.output(pdf_output_path)
print(f"PDF Generated successfully: {pdf_output_path}")
