import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import AuthLayout, { AuthAlert } from '../layouts/AuthLayout';
import { Input, Button } from '../components/ui';

const ResetPasswordPage = () => {
  const [searchParams]          = useSearchParams();
  const token                   = searchParams.get('token');
  const navigate                = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon="key" title="Reset password" subtitle="Enter your new password below">
      {error && <AuthAlert>{error}</AuthAlert>}
      {success && <AuthAlert type="success">{success}</AuthAlert>}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password" type="password" required value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
          />
          <Input
            label="Confirm Password" type="password" required value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Reset Password
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500 mt-4">
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Back to Login</Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
