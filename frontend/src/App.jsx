import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ComplaintForm from './pages/ComplaintForm';
import ComplaintList from './pages/ComplaintList';
import Notifications from './pages/Notifications';
import ComplaintDetail from './pages/ComplaintDetail';
import { ToastProvider } from './context/ToastContext';
import NoticeBoardPage from './pages/NoticeBoardPage';
import ProfilePage from './pages/ProfilePage';
// ✅ NEW — Admin pages
import UserManagement from './pages/admin/UserManagement';
import CreateUser from './pages/admin/CreateUser';
import NoticeDetailPage from './pages/NoticeDetailPage';
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/complaints" element={
              <ProtectedRoute><ComplaintList /></ProtectedRoute>
            } />
            <Route path="/complaints/new" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <ComplaintForm />
              </ProtectedRoute>
            } />
            <Route path="/complaints/:id" element={
              <ProtectedRoute><ComplaintDetail /></ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute><Notifications /></ProtectedRoute>
            } />
            <Route path="/notices" element={
              <ProtectedRoute><NoticeBoardPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />

            {/* ✅ NEW — Admin routes, only ADMIN/WARDEN/CARETAKER */}
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'WARDEN', 'CARETAKER']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/new" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'WARDEN', 'CARETAKER']}>
                <CreateUser />
              </ProtectedRoute>
            } />

            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          <Route path="/notices/:id" element={
  <ProtectedRoute><NoticeDetailPage /></ProtectedRoute>
} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
