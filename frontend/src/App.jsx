import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ComplaintDetail from './pages/ComplaintDetail';

// Loading spinner component
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
      <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-slate-400 font-medium animate-pulse">Loading Campus Redressal...</p>
  </div>
);

// Protected routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  const isAdmin = user && user.role === 'admin';
  return isAdmin ? children : <Navigate to="/student" replace />;
};

const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  const isStaff = user && user.role === 'staff';
  return isStaff ? children : <Navigate to="/student" replace />;
};

const AuthRedirectRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'staff') {
      return <Navigate to="/staff" replace />;
    } else {
      return <Navigate to="/student" replace />;
    }
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <AuthRedirectRoute>
                <Login />
              </AuthRedirectRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRedirectRoute>
                <Register />
              </AuthRedirectRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff"
            element={
              <StaffRoute>
                <StaffDashboard />
              </StaffRoute>
            }
          />

          {/* Shared Complaint details view */}
          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute>
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          {/* Fallback routing */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
