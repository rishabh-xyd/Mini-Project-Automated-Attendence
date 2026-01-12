import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AttendanceKiosk from './pages/AttendanceKiosk';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading...</div>;
  if (!user) return <Navigate to="/" />;

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Kiosk is the Landing Page */}
      <Route path="/" element={<AttendanceKiosk />} />

      {/* Login Page */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />

      {/* User Dashboard (Student vs Teacher vs Default) */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            {user?.role === 'admin' ? <Navigate to="/admin" /> :
              user?.role === 'teacher' ? <TeacherDashboard /> :
                user?.role === 'student' ? <StudentDashboard /> : <Dashboard />}
          </PrivateRoute>
        }
      />

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <PrivateRoute adminOnly={true}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
