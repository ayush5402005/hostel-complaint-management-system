import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const roleColors = {
  STUDENT:   'bg-blue-100 text-blue-700',
  WORKER:    'bg-green-100 text-green-700',
  CARETAKER: 'bg-yellow-100 text-yellow-700',
  WARDEN:    'bg-purple-100 text-purple-700',
};

const ProfilePage = () => {
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile]   = useState(null);
  const [edit, setEdit]         = useState(false);
  const [form, setForm]         = useState({});
  const [newPass, setNewPass]   = useState('');
  const [confPass, setConfPass] = useState('');
  const [saving, setSaving]     = useState(false);

  const isStudent = user?.role === 'STUDENT';

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      setProfile(res.data);
      setForm(res.data);
    } catch { showToast('Failed to load profile', 'error'); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', {
        name:        form.name,
        phoneNumber: form.phoneNumber,
        department:  form.department,
        hostelBlock: form.hostelBlock,
        roomNumber:  form.roomNumber,
      });
      setProfile(res.data);
      setForm(res.data);
      setEdit(false);
      showToast('Profile updated successfully!', 'success');
    } catch { showToast('Failed to update profile', 'error'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (!newPass || !confPass) { showToast('Please fill both fields', 'warning'); return; }
    if (newPass !== confPass)  { showToast('Passwords do not match', 'error'); return; }
    if (newPass.length < 6)    { showToast('Minimum 6 characters required', 'warning'); return; }
    try {
      await api.put('/users/me/password', { newPassword: newPass });
      setNewPass(''); setConfPass('');
      showToast('Password changed successfully!', 'success');
    } catch { showToast('Failed to change password', 'error'); }
  };

  if (!profile) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Avatar Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 flex items-center gap-5 text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {profile.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-sm opacity-80 mt-0.5">{profile.email}</p>
            <span className={`inline-block mt-2 text-xs font-bold px-3 py-0.5 rounded-full bg-white/20`}>
              {profile.role}
            </span>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">Profile Information</h2>
            {!edit && (
              <button onClick={() => setEdit(true)}
                className="text-sm text-indigo-600 hover:underline font-medium">
                ✏️ Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Full Name"    value={form.name}        edit={edit} onChange={v => setForm(f => ({...f, name: v}))} />
            <Field label="Phone"        value={form.phoneNumber} edit={edit} onChange={v => setForm(f => ({...f, phoneNumber: v}))} />
            <Field label="Department"   value={form.department}  edit={edit} onChange={v => setForm(f => ({...f, department: v}))} />
            <Field label="Scholar No."  value={profile.scholarNumber} edit={false} />
            {isStudent && <>
              <Field label="Hostel Block" value={form.hostelBlock} edit={edit} onChange={v => setForm(f => ({...f, hostelBlock: v}))} />
              <Field label="Room Number"  value={form.roomNumber}  edit={edit} onChange={v => setForm(f => ({...f, roomNumber: v}))} />
            </>}
            <Field label="Email" value={profile.email} edit={false} />
            <Field label="Role"  value={profile.role}  edit={false} />
          </div>

          {edit && (
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {saving ? 'Saving...' : '✅ Save Changes'}
              </button>
              <button onClick={() => { setEdit(false); setForm(profile); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium transition">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-5">🔒 Change Password</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">New Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confPass}
                onChange={e => setConfPass(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button onClick={handlePasswordChange}
            className="mt-4 bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-medium transition">
            🔑 Update Password
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>
      </div>
    </div>
  );
};

const Field = ({ label, value, edit, onChange }) => (
  <div>
    <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">{label}</label>
    {edit && onChange
      ? <input value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      : <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    }
  </div>
);

export default ProfilePage;
