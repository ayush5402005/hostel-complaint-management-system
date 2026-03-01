import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const CreateUser = () => {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  // ✅ ADMIN cannot create another ADMIN
  const allowedRoles = () => {
    if (user.role === 'ADMIN')     return ['WARDEN', 'CARETAKER', 'WORKER', 'STUDENT'];
    if (user.role === 'WARDEN')    return ['CARETAKER', 'WORKER'];
    if (user.role === 'CARETAKER') return ['WORKER'];
    return [];
  };

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: allowedRoles()[0] || '',
    phoneNumber: '', scholarNumber: '', hostelBlock: '',
    roomNumber: '', department: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // ✅ Correct endpoint per role
  const endpointMap = {
    WARDEN:    '/admin/create-warden',
    CARETAKER: '/admin/create-caretaker',
    WORKER:    '/admin/create-worker',
    STUDENT:   '/auth/register',
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">You don't have permission to create users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">

        <button onClick={() => navigate('/admin/users')}
          className="text-sm text-indigo-600 hover:underline mb-5 flex items-center gap-1">
          ← Back to Users
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-6">Create New User</h1>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Role *</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {allowedRoles().map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                placeholder="e.g. Ramesh Kumar"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                placeholder="e.g. ramesh@hostel.com"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Password *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                placeholder="Min 6 characters"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Phone Number *</label>
              <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required
                placeholder="e.g. 9876543210"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Student-only fields */}
            {isStudent && (
              <>
                <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-blue-600 uppercase">Student Details</p>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Scholar Number *</label>
                    <input name="scholarNumber" value={form.scholarNumber} onChange={handleChange}
                      placeholder="e.g. 0901CS211001"
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Hostel Block *</label>
                      <input name="hostelBlock" value={form.hostelBlock} onChange={handleChange}
                        placeholder="e.g. A"
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Room Number *</label>
                      <input name="roomNumber" value={form.roomNumber} onChange={handleChange}
                        placeholder="e.g. 101"
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Worker-only field */}
            {isWorker && (
              <div className="border border-green-100 bg-green-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-600 uppercase mb-2">Worker Details</p>
                <label className="text-xs font-semibold text-gray-500 uppercase">Department *</label>
                <input name="department" value={form.department} onChange={handleChange}
                  placeholder="e.g. Plumbing, Electrical, Cleaning"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            )}

            {/* Warden / Caretaker hostel block */}
            {['WARDEN', 'CARETAKER'].includes(form.role) && (
              <div className="border border-purple-100 bg-purple-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-purple-600 uppercase mb-2">Assignment</p>
                <label className="text-xs font-semibold text-gray-500 uppercase">Hostel Block</label>
                <input name="hostelBlock" value={form.hostelBlock} onChange={handleChange}
                  placeholder="e.g. Block A, Boys Hostel"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating...' : `Create ${form.role} Account`}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>
      </div>
    </div>
  );
};

export default CreateUser;
