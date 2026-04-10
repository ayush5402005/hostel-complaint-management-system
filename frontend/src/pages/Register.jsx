import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const HOSTEL_ID = 14; // update after DB insert
const BLOCKS = [
  { id: 27, name: '10A' }, // update after DB insert
  { id: 28, name: '10B' },
];

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phoneNumber: '', scholarNumber: '',
    blockId: '', roomNumber: '',
  });

  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.endsWith('@stu.manit.ac.in')) {
      setError('Please use your college email (@stu.manit.ac.in) to register.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!form.blockId) {
      setError('Please select your block.');
      return;
    }
    if (!/^\d{3}$/.test(form.roomNumber)) {
      setError('Room number must be exactly 3 digits (e.g. 309).');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name:          form.name,
        email:         form.email,
        password:      form.password,
        phoneNumber:   form.phoneNumber,
        scholarNumber: form.scholarNumber,
        hostelId:      HOSTEL_ID,
        blockId:       Number(form.blockId),
        roomNumber:    form.roomNumber,
        role:          'STUDENT',
      });
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏠</div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Student registration — Hostel 10, MANIT</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">College Email</label>
              <input type="email" required value={form.email}
                placeholder="yourname@stu.manit.ac.in"
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">Must be @stu.manit.ac.in</p>
            </div>
          </div>

          {/* Password + Confirm Password */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" required value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
                  ${form.confirmPassword && form.password !== form.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'}`}
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" required value={form.phoneNumber}
              onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="10-digit mobile number"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Student Details */}
          <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-blue-600 uppercase">Student Details</p>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                🏠 Hostel 10
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Scholar No.</label>
                <input type="text" required value={form.scholarNumber}
                  onChange={e => setForm({ ...form, scholarNumber: e.target.value })}
                  placeholder="2311601XXX"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Block</label>
                <select required value={form.blockId}
                  onChange={e => setForm({ ...form, blockId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">Select</option>
                  {BLOCKS.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Room No. <span className="text-gray-400">(3 digits)</span>
                </label>
                <input
                  type="text" required value={form.roomNumber}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                    setForm({ ...form, roomNumber: val });
                  }}
                  placeholder="309"
                  maxLength={3}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
                    ${form.roomNumber && form.roomNumber.length < 3
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'}`}
                />
                {form.roomNumber && form.roomNumber.length < 3 && (
                  <p className="text-xs text-red-500 mt-0.5">Must be 3 digits</p>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
