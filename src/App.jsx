import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GroupsPage from './pages/GroupsPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/groups" replace /> : <AuthPage />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/groups" replace /> : <ForgotPasswordPage />}
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/groups"
        element={<ProtectedRoute><GroupsPage /></ProtectedRoute>}
      />
      <Route
        path="/map/:groupId"
        element={<ProtectedRoute><MapPage /></ProtectedRoute>}
      />
      <Route
        path="/profile"
        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to={user ? '/groups' : '/auth'} replace />} />
    </Routes>
  );
}
