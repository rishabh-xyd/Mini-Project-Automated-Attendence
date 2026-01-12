@echo off
start cmd /k "cd backend && uvicorn main:app --reload"
start cmd /k "cd frontend && npm run dev"
echo "Project started! Backend running on port 8000, Frontend on port 5173 (usually)."
