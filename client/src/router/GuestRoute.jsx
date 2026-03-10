import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirects authenticated users away from public pages (login/register)
export default function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}
