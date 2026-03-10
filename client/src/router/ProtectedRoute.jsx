import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirects unauthenticated users to /login
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // AuthProvider handles full-screen loader
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
