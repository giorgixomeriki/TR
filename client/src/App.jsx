import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskWorkspace from './pages/TaskWorkspace';
import SkillsPage from './pages/SkillsPage';
import FocusModeLayout from './components/FocusModeLayout';
import ProtectedRoute from './router/ProtectedRoute';
import GuestRoute from './router/GuestRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Routes>
      {/* Public routes — redirect to dashboard if already logged in */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Protected routes — redirect to login if not authenticated */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Task workspace */}
      <Route
        path="/task/:id"
        element={
          <ProtectedRoute>
            <TaskWorkspace />
          </ProtectedRoute>
        }
      />

      {/* Focus mode */}
      <Route
        path="/focus/:id"
        element={
          <ProtectedRoute>
            <FocusModeLayout />
          </ProtectedRoute>
        }
      />

      {/* Skills page */}
      <Route
        path="/skills"
        element={
          <ProtectedRoute>
            <SkillsPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/"   element={<Navigate to="/dashboard" replace />} />
      <Route path="*"   element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
