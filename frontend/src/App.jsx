import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { connectSSE, disconnectSSE } from './utils/sseClient';
import api from './api/axios';

import ProtectedRoute       from './components/ProtectedRoute';
import Login                from './pages/Login';
import Register             from './pages/Register';
import Dashboard            from './pages/Dashboard';
import ComplaintForm        from './pages/ComplaintForm';
import ComplaintList        from './pages/ComplaintList';
import Notifications        from './pages/Notifications';
import ComplaintDetail      from './pages/ComplaintDetail';
import NoticeBoardPage      from './pages/NoticeBoardPage';
import ProfilePage          from './pages/ProfilePage';
import StudentProfilePage   from './pages/StudentProfilePage';
import UserManagement       from './pages/admin/UserManagement';
import CreateUser           from './pages/admin/CreateUser';
import StudentDirectory     from './pages/admin/StudentDirectory';
import AnalyticsDashboard   from './pages/admin/AnalyticsDashboard';
import WorkerRatings        from './pages/admin/WorkerRatings';
import NoticeDetailPage     from './pages/NoticeDetailPage';
import OtpVerificationPage  from './pages/OtpVerificationPage';
import ForgotPasswordPage   from './pages/ForgotPasswordPage';
import ResetPasswordPage    from './pages/ResetPasswordPage';

const STAFF_ROLES = ['ADMIN', 'WARDEN', 'CARETAKER'];

// ── SSE connector — lives inside all providers ────────────────────────────────
function SseConnector() {
  const { user }                        = useAuth();
  const { showToast }                   = useToast();
  const { setUnread, incrementUnread }  = useNotification();

  useEffect(() => {
    if (!user) return;

    // load initial unread count from DB
    api.get('/notifications/unread-count')
      .then(res => setUnread(res.data.unreadCount))
      .catch(() => {});

    // open SSE — on each new notification: toast + badge bump
    connectSSE((notification) => {
      showToast(notification.message, 'info');
      incrementUnread();
    });

    return () => disconnectSSE();
  }, [user]);

  return null;
}

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/verify-otp"      element={<OtpVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/complaints" element={<ProtectedRoute><ComplaintList /></ProtectedRoute>} />
      <Route path="/complaints/new" element={
        <ProtectedRoute allowedRoles={['STUDENT']}><ComplaintForm /></ProtectedRoute>
      } />
      <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
      <Route path="/notifications"  element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/notices"        element={<ProtectedRoute><NoticeBoardPage /></ProtectedRoute>} />
      <Route path="/notices/:id"    element={<ProtectedRoute><NoticeDetailPage /></ProtectedRoute>} />
      <Route path="/profile"        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/my-profile" element={
        <ProtectedRoute allowedRoles={['STUDENT']}><StudentProfilePage /></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={STAFF_ROLES}><UserManagement /></ProtectedRoute>
      } />
      <Route path="/admin/users/new" element={
        <ProtectedRoute allowedRoles={STAFF_ROLES}><CreateUser /></ProtectedRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedRoute allowedRoles={STAFF_ROLES}><StudentDirectory /></ProtectedRoute>
      } />
      <Route path="/admin/worker-ratings" element={
        <ProtectedRoute allowedRoles={STAFF_ROLES}><WorkerRatings /></ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={STAFF_ROLES}><AnalyticsDashboard /></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ToastProvider>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <SseConnector />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ToastProvider>
  );
}

export default App;
