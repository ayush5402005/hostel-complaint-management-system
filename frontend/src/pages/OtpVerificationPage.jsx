import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import AuthLayout, { AuthAlert } from '../layouts/AuthLayout';
import { Button } from '../components/ui';

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setSuccess('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setSuccess('OTP resent! Check your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout icon="mail" title="Verify your email" subtitle={<>OTP sent to <span className="font-semibold text-indigo-300">{email}</span></>}>
      <p className="text-center text-xs text-slate-400 -mt-4 mb-5">Valid for 10 minutes · Max 3 attempts</p>

      {error && <AuthAlert>{error}</AuthAlert>}
      {success && <AuthAlert type="success">{success}</AuthAlert>}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 text-center">Enter OTP</label>
          <input
            type="text" maxLength={6} required value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="------"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
        </div>

        <Button type="submit" loading={loading} disabled={otp.length !== 6} className="w-full" size="lg">
          Verify OTP
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-slate-500">
          Didn't receive OTP?{' '}
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default OtpVerificationPage;
