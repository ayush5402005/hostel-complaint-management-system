import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AppShell from '../layouts/AppShell';
import { Card, CardHeader, Input, Button, Icon, Avatar, Spinner } from '../components/ui';
import { ROLE_META } from '../utils/statusMeta';

const ProfilePage = () => {
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile]   = useState(null);
  const [edit, setEdit]         = useState(false);
  const [form, setForm]         = useState({});
  const [newPass, setNewPass]   = useState('');
  const [confPass, setConfPass] = useState('');
  const [saving, setSaving]     = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const isStudent = user?.role === 'STUDENT';

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/users/me');
      setProfile(res.data);
      setForm(res.data);
    } catch { showToast('Failed to load profile', 'error'); }
  }, [showToast]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only name/phoneNumber/roomNumber are actually persisted by
      // PUT /users/me (see user.service.js#updateMe) — department and block
      // were never editable here, in the original Java app either.
      const res = await api.put('/users/me', {
        name:        form.name,
        phoneNumber: form.phoneNumber,
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
    setChangingPass(true);
    try {
      await api.put('/users/me/password', { newPassword: newPass });
      setNewPass(''); setConfPass('');
      showToast('Password changed successfully!', 'success');
    } catch { showToast('Failed to change password', 'error'); }
    finally { setChangingPass(false); }
  };

  if (!profile) return <AppShell><Spinner full /></AppShell>;

  const roleMeta = ROLE_META[profile.role] || {};

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 rounded-2xl p-6 flex items-center gap-5 text-white shadow-lg shadow-indigo-600/20">
          <Avatar name={profile.name} size="lg" tone="bg-white/15 text-white ring-2 ring-white/30" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{profile.name}</h1>
            <p className="text-sm opacity-80 mt-0.5 truncate">{profile.email}</p>
            <span className="inline-block mt-2 text-xs font-bold px-3 py-0.5 rounded-full bg-white/20">{roleMeta.label || profile.role}</span>
          </div>
        </div>

        <Card>
          <CardHeader
            title="Profile Information"
            action={!edit && <Button variant="ghost" size="sm" icon="edit" onClick={() => setEdit(true)}>Edit</Button>}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name"    value={form.name}        edit={edit} onChange={v => setForm(f => ({...f, name: v}))} />
            <Field label="Phone"        value={form.phoneNumber} edit={edit} onChange={v => setForm(f => ({...f, phoneNumber: v}))} />
            <Field label="Department"   value={profile.department} edit={false} />
            <Field label="Scholar No."  value={profile.scholarNumber} edit={false} />
            {isStudent && <>
              <Field label="Hostel Block" value={profile.hostelBlock} edit={false} />
              <Field label="Room Number"  value={form.roomNumber}  edit={edit} onChange={v => setForm(f => ({...f, roomNumber: v}))} />
            </>}
            <Field label="Email" value={profile.email} edit={false} />
            <Field label="Role"  value={roleMeta.label || profile.role}  edit={false} />
          </div>

          {edit && (
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} loading={saving} icon="checkCircle">Save Changes</Button>
              <Button variant="subtle" onClick={() => { setEdit(false); setForm(profile); }}>Cancel</Button>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Change Password" icon={<Icon name="lock" size={14} className="text-slate-400" />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="New Password" type="password" placeholder="Min 6 characters" value={newPass} onChange={e => setNewPass(e.target.value)} />
            <Input label="Confirm Password" type="password" placeholder="Repeat new password" value={confPass} onChange={e => setConfPass(e.target.value)} />
          </div>
          <Button variant="subtle" className="mt-4 !bg-slate-800 !text-white hover:!bg-slate-900" icon="key" onClick={handlePasswordChange} loading={changingPass}>
            Update Password
          </Button>
        </Card>
      </div>
    </AppShell>
  );
};

const Field = ({ label, value, edit, onChange }) => (
  <div>
    <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block tracking-wide">{label}</label>
    {edit && onChange
      ? <Input value={value || ''} onChange={e => onChange(e.target.value)} />
      : <p className="text-sm font-medium text-slate-800 break-words">{value || '—'}</p>}
  </div>
);

export default ProfilePage;
