import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import AppShell from '../../layouts/AppShell';
import { Card, Input, Select, Button, Icon, Badge } from '../../components/ui';

const CreateUser = () => {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  const allowedRoles = () => {
    if (user.role === 'ADMIN')     return ['WARDEN', 'CARETAKER', 'WORKER', 'STUDENT'];
    if (user.role === 'WARDEN')    return ['CARETAKER', 'WORKER'];
    if (user.role === 'CARETAKER') return ['WORKER'];
    return [];
  };

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: allowedRoles()[0] || '',
    phoneNumber: '', scholarNumber: '', block: '',
    roomNumber: '', departmentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  // GET /admin/departments is ADMIN-only on the backend (matches the
  // original Java @PreAuthorize) — Wardens/Caretakers creating a Worker
  // can't assign a department at all, same as before this fix, just no
  // longer via a text field that silently did nothing.
  useEffect(() => {
    if (user.role === 'ADMIN') {
      api.get('/admin/departments').then(res => setDepartments(res.data)).catch(() => {});
    }
  }, [user.role]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const endpointMap = {
    WARDEN:    '/admin/create-warden',
    CARETAKER: '/admin/create-caretaker',
    WORKER:    '/admin/create-worker',
    // Admin-created students are active immediately, no OTP step — distinct
    // from the public self-registration endpoint used by /register.
    STUDENT:   '/admin/create-student',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = endpointMap[form.role];
    if (!endpoint) {
      showToast('Invalid role selected', 'error');
      setLoading(false);
      return;
    }

    try {
      await api.post(endpoint, form);
      showToast(`${form.role} account created successfully!`, 'success');
      navigate('/admin/users');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isStudent = form.role === 'STUDENT';
  const isWorker  = form.role === 'WORKER';

  if (allowedRoles().length === 0) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500">You don't have permission to create users.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button onClick={() => navigate('/admin/users')}
        className="text-sm text-indigo-600 hover:text-indigo-700 mb-5 flex items-center gap-1.5 font-medium">
        <Icon name="arrowLeft" size={15} /> Back to Users
      </button>

      <Card className="max-w-lg">
        <h1 className="text-xl font-bold text-slate-800 mb-6">Create New User</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Role" required name="role" value={form.role} onChange={handleChange}>
            {allowedRoles().map(r => <option key={r} value={r}>{r}</option>)}
          </Select>

          <Input label="Full Name" required name="name" value={form.name} onChange={handleChange} placeholder="e.g. Ramesh Kumar" />
          <Input label="Email" required type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. ramesh@hostel.com" />
          <Input label="Password" required type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" />
          <Input label="Phone Number" required name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="e.g. 9876543210" />

          {isStudent && (
            <div className="border border-indigo-100 bg-indigo-50/60 rounded-xl p-4 space-y-3">
              <Badge tone="indigo">Student Details</Badge>
              <Input label="Scholar Number" name="scholarNumber" value={form.scholarNumber} onChange={handleChange} placeholder="e.g. 0901CS211001" />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Block" name="block" value={form.block} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </Select>
                <Input label="Room Number" name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="e.g. 101" />
              </div>
            </div>
          )}

          {isWorker && (
            <div className="border border-emerald-100 bg-emerald-50/60 rounded-xl p-4 space-y-2">
              <Badge tone="emerald">Worker Details</Badge>
              {user.role === 'ADMIN' ? (
                <Select label="Department" name="departmentId" value={form.departmentId} onChange={handleChange}>
                  <option value="">Select department (optional)</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              ) : (
                <p className="text-xs text-slate-500">
                  Department can only be assigned by an admin — this worker will be created without one.
                </p>
              )}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2" size="lg" icon="plus">
            Create {form.role} Account
          </Button>
        </form>
      </Card>
    </AppShell>
  );
};

export default CreateUser;
