import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthLayout, { AuthAlert } from '../layouts/AuthLayout';
import { Input, Select, Badge, Button } from '../components/ui';

// This app serves Hostel 10 only — block is a fixed A/B choice, not a
// hostel/block lookup anymore. See backend/docs/MIGRATION_NOTES.md
// "Hostel-10 scoping".
const BLOCKS = ['A', 'B'];

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phoneNumber: '', scholarNumber: '',
    block: '', roomNumber: '',
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
    if (!form.block) {
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
        block:         form.block,
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
    <AuthLayout title="Create your account" subtitle="Student registration — Hostel 10, MANIT" wide>
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name" required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="John Doe"
          />
          <Input
            label="College Email" type="email" required value={form.email}
            hint="@stu.manit.ac.in"
            placeholder="yourname@stu.manit.ac.in"
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Password" type="password" required value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Min 6 characters"
          />
          <Input
            label="Confirm Password" type="password" required value={form.confirmPassword}
            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Re-enter password"
            error={form.confirmPassword && form.password !== form.confirmPassword ? "Passwords don't match" : null}
          />
        </div>

        <Input
          label="Phone Number" type="tel" required value={form.phoneNumber}
          onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
          placeholder="10-digit mobile number"
        />

        <div className="border border-indigo-100 bg-indigo-50/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Student Details</p>
            <Badge tone="indigo" icon="building">Hostel 10</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Scholar No." required value={form.scholarNumber}
              onChange={e => setForm({ ...form, scholarNumber: e.target.value })}
              placeholder="2311601XXX"
            />
            <Select
              label="Block" required value={form.block}
              onChange={e => setForm({ ...form, block: e.target.value })}
            >
              <option value="">Select</option>
              {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
            <Input
              label="Room No." hint="3 digits" required value={form.roomNumber}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                setForm({ ...form, roomNumber: val });
              }}
              placeholder="309" maxLength={3}
              error={form.roomNumber && form.roomNumber.length < 3 ? 'Must be 3 digits' : null}
            />
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Login</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
