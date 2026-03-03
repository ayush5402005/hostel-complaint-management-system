import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📧</div>
          <h1 className="text-2xl font-bold text-gray-800">Verify Your Email</h1>
          <p className="text-gray-500 text-sm mt-1">
            OTP sent to <span className="font-medium text-indigo-600">{email}</span>
          </p>
          <p className="text-gray-400 text-xs mt-1">Valid for 10 minutes · Max 3 attempts</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
            <input
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/, ''))}
              placeholder="______"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button type="submit" disabled={loading || otp.length !== 6}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Didn't receive OTP?{' '}
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-indigo-600 hover:underline font-medium disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend OTP'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
