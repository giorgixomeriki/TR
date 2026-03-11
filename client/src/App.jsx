import { Routes, Route, Navigate } from 'react-router-dom';
import Login           from './pages/Login';
import Register        from './pages/Register';
import Dashboard       from './pages/Dashboard';
import TaskWorkspace   from './pages/TaskWorkspace';
import SkillsPage      from './pages/SkillsPage';
import GymPage         from './pages/GymPage';
import HabitPage       from './pages/HabitPage';
import FinanceDashboard from './pages/FinanceDashboard';
import FocusModeLayout  from './components/FocusModeLayout';
import FocusArenaLayout from './components/FocusArenaLayout';
import Layout           from './components/Layout';
import ProtectedRoute   from './router/ProtectedRoute';
import GuestRoute       from './router/GuestRoute';
import LoadingSpinner   from './components/LoadingSpinner';
import { useAuth }      from './context/AuthContext';

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Routes>
      {/* ── Public (guest-only) ── */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── Fullscreen modes — own headers, no shared Layout ── */}
      <Route path="/task/:id"  element={<ProtectedRoute><TaskWorkspace /></ProtectedRoute>} />
      <Route path="/focus/:id" element={<ProtectedRoute><FocusModeLayout /></ProtectedRoute>} />
      <Route path="/arena/:id" element={<ProtectedRoute><FocusArenaLayout /></ProtectedRoute>} />

      {/* ── Protected pages — all share the Navbar + Sidebar Layout ── */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/finance"   element={<FinanceDashboard />} />
        <Route path="/habits"    element={<HabitPage />} />
        <Route path="/gym"       element={<GymPage />} />
        <Route path="/skills"    element={<SkillsPage />} />

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
