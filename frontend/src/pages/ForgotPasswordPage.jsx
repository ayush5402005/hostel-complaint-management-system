import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AuthLayout, { AuthAlert } from '../layouts/AuthLayout';
import { Input, Button } from '../components/ui';

const ForgotPasswordPage = () => {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('If this email is registered, a reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon="mail" title="Forgot password" subtitle="Enter your college email and we'll send you a reset link">
      {error && <AuthAlert>{error}</AuthAlert>}
      {success && <AuthAlert type="success">{success}</AuthAlert>}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="College Email" type="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@stu.manit.ac.in"
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Send Reset Link
          </Button>
        </form>
      )}

      {success && (
        <Link to="/login">
          <Button className="w-full" size="lg">Back to Login</Button>
        </Link>
      )}

      {!success && (
        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Back to Login</Link>
        </p>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
