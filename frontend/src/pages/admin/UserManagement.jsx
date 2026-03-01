import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const ROLES = ['', 'ADMIN', 'WARDEN', 'CARETAKER', 'WORKER', 'STUDENT'];

const roleColors = {
  ADMIN:         'bg-red-100 text-red-700',
  WARDEN:        'bg-purple-100 text-purple-700',
  CARETAKER:     'bg-blue-100 text-blue-700',
  WORKER:        'bg-green-100 text-green-700',
  STUDENT:       'bg-indigo-100 text-indigo-700',
  MESS_CONVENOR: 'bg-yellow-100 text-yellow-700',
};

// ✅ Star display component
const StarDisplay = ({ rating }) => {
  if (!rating) return <span className="text-xs text-gray-400">No ratings</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star}
          className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>
          ★
        </span>
      ))}
      <span className="text-xs font-semibold text-gray-600 ml-1">{rating}/5</span>
    </div>
  );
};

const UserManagement = () => {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  const [users, setUsers]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [roleFilter, setRoleFilter]         = useState('');
  const [search, setSearch]                 = useState('');
  const [actionLoading, setActionLoading]   = useState(null);

  // ✅ Worker ratings map: { workerId: { averageRating, closed } }
  const [workerStats, setWorkerStats]       = useState({});
  const [ratingsLoading, setRatingsLoading] = useState(false);

  // Edit modal state
  const [editUser, setEditUser]             = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [editLoading, setEditLoading]       = useState(false);

  const canCreate = ['ADMIN', 'WARDEN', 'CARETAKER'].includes(user.role);
  const canEdit   = ['ADMIN', 'WARDEN'].includes(user.role);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = roleFilter ? `/admin/users/role/${roleFilter}` : '/admin/users';
      const res = await api.get(url);
      setUsers(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch ratings for all workers in the current user list
  const fetchWorkerRatings = async (userList) => {
    const workers = userList.filter(u => u.role === 'WORKER');
    if (workers.length === 0) return;
    setRatingsLoading(true);
    try {
      const results = await Promise.allSettled(
        workers.map(w => api.get(`/admin/workers/${w.id}/stats`))
      );
      const statsMap = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          statsMap[workers[index].id] = result.value.data;
        }
      });
      setWorkerStats(statsMap);
    } catch {}
    finally {
      setRatingsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  // ✅ When users load, fetch worker ratings
  useEffect(() => {
    if (users.length > 0) fetchWorkerRatings(users);
  }, [users]);

  const handleDeactivate = async (userId) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/deactivate`);
      showToast('User deactivated', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to deactivate', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (userId) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/activate`);
      showToast('User activated', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to activate', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditOpen = (u) => {
    setEditUser(u);
    setEditForm({
      name:        u.name,
      phoneNumber: u.phoneNumber,
      department:  u.department || '',
      hostelBlock: u.hostelBlock || '',
      roomNumber:  u.roomNumber || '',
    });
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      await api.put(`/admin/users/${editUser.id}`, editForm);
      showToast('User updated successfully!', 'success');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phoneNumber?.includes(search)
  );

  // ✅ Show rating column only when viewing workers
  const showRatingCol = roleFilter === 'WORKER' ||
    (!roleFilter && filtered.some(u => u.role === 'WORKER'));

  const tableHeaders = ['#', 'Name', 'Email', 'Role', 'Phone', 'Details',
    ...(showRatingCol ? ['Rating'] : []),
    'Status', 'Actions'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Edit User — {editUser.name}
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Name',         key: 'name' },
                { label: 'Phone Number', key: 'phoneNumber' },
                { label: 'Department',   key: 'department' },
                { label: 'Hostel Block', key: 'hostelBlock' },
                { label: 'Room Number',  key: 'roomNumber' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 font-medium">{label}</label>
                  <input type="text"
                    value={editForm[key] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditUser(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={editLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} user{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          {canCreate && (
            <button onClick={() => navigate('/admin/users/new')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              + Add User
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input type="text"
            placeholder="🔍 Search by name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {ROLES.map(r => (
              <option key={r} value={r}>{r || 'All Roles'}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-lg font-medium">No users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {tableHeaders.map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(u => (
                    <tr key={u.id}
                      className={`hover:bg-gray-50 transition ${!u.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs">{u.id}</td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{u.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-500">{u.email}</td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-500">{u.phoneNumber}</td>

                      {/* Details */}
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {u.role === 'STUDENT'
                          ? `Block ${u.hostelBlock} / Room ${u.roomNumber}`
                          : u.department || '—'}
                      </td>

                      {/* ✅ Rating column — only for WORKER rows */}
                      {showRatingCol && (
                        <td className="px-4 py-3">
                          {u.role === 'WORKER' ? (
                            ratingsLoading ? (
                              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <div>
                                <StarDisplay rating={workerStats[u.id]?.averageRating} />
                                {workerStats[u.id] && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {workerStats[u.id].closed} job{workerStats[u.id].closed !== 1 ? 's' : ''} closed
                                  </p>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                          ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {canEdit && (
                            <button onClick={() => handleEditOpen(u)}
                              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg transition">
                              ✏️ Edit
                            </button>
                          )}
                          {canEdit && (
                            u.active ? (
                              <button
                                onClick={() => handleDeactivate(u.id)}
                                disabled={actionLoading === u.id}
                                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg transition disabled:opacity-50">
                                {actionLoading === u.id ? '...' : '🚫 Deactivate'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(u.id)}
                                disabled={actionLoading === u.id}
                                className="text-xs bg-green-50 hover:bg-green-100 text-green-600 px-3 py-1 rounded-lg transition disabled:opacity-50">
                                {actionLoading === u.id ? '...' : '✅ Activate'}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>
      </div>
    </div>
  );
};

export default UserManagement;
