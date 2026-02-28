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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/complaints/:id" element={
  <ProtectedRoute><ComplaintDetail /></ProtectedRoute>
} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
