import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import AppShell from '../../layouts/AppShell';
import { PageHeader, Card, Input, Select, Button, Icon, Badge, Avatar, EmptyState, Spinner, SkeletonList, Modal } from '../../components/ui';
import { ROLE_META } from '../../utils/statusMeta';

const ROLES = ['', 'ADMIN', 'WARDEN', 'CARETAKER', 'WORKER', 'STUDENT'];

const StarDisplay = ({ rating }) => {
  if (!rating) return <span className="text-xs text-slate-400">No ratings</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Icon key={star} name="starFilled" size={13} className={star <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'} />
      ))}
      <span className="text-xs font-semibold text-slate-600 ml-1">{rating}/5</span>
    </div>
  );
};

const UserManagement = () => {
  const { user }        = useAuth();
  const { showToast }   = useToast();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  const [users, setUsers]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [actionLoading, setActionLoading]   = useState(null);
  const [workerStats, setWorkerStats]       = useState({});
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [editUser, setEditUser]             = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [editLoading, setEditLoading]       = useState(false);

  const [roleFilter, setRoleFilter] = useState(
    searchParams.get('role') || (user.role === 'CARETAKER' ? 'WORKER' : '')
  );

  const canCreate = ['ADMIN', 'WARDEN', 'CARETAKER'].includes(user.role);
  const canEdit   = ['ADMIN', 'WARDEN'].includes(user.role);
  const isFilterLocked = user.role === 'CARETAKER';

  const fetchUsers = useCallback(async () => {
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
  }, [roleFilter, showToast]);

  const fetchWorkerRatings = useCallback(async (userList) => {
    const workers = userList.filter(u => u.role === 'WORKER');
    if (workers.length === 0) return;
    setRatingsLoading(true);
    try {
      const results = await Promise.allSettled(workers.map(w => api.get(`/admin/workers/${w.id}/stats`)));
      const statsMap = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') statsMap[workers[index].id] = result.value.data;
      });
      setWorkerStats(statsMap);
    } catch { /* Promise.allSettled already isolates per-worker failures */ }
    finally { setRatingsLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { if (users.length > 0) fetchWorkerRatings(users); }, [users, fetchWorkerRatings]);

  const handleDeactivate = async (userId) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/deactivate`);
      showToast('User deactivated', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to deactivate', 'error');
    } finally { setActionLoading(null); }
  };

  const handleActivate = async (userId) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/activate`);
      showToast('User activated', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to activate', 'error');
    } finally { setActionLoading(null); }
  };

  const handleEditOpen = (u) => {
    setEditUser(u);
    // Only name/phoneNumber/roomNumber are actually persisted by PUT
    // /admin/users/:id (see admin.service.js#updateUser) — department and
    // block were never editable here, in the original Java app either.
    setEditForm({ name: u.name, phoneNumber: u.phoneNumber, roomNumber: u.roomNumber || '' });
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
    } finally { setEditLoading(false); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phoneNumber?.includes(search)
  );

  const showRatingCol = roleFilter === 'WORKER' || (!roleFilter && filtered.some(u => u.role === 'WORKER'));
  const tableHeaders = ['Name', 'Email', 'Role', 'Phone', 'Details', ...(showRatingCol ? ['Rating'] : []), 'Status', 'Actions'];

  return (
    <AppShell wide>
      <Modal open={!!editUser} onClose={() => setEditUser(null)} icon="edit" title={editUser ? `Edit User — ${editUser.name}` : ''}>
        <div className="space-y-3">
          {[
            { label: 'Name', key: 'name' },
            { label: 'Phone Number', key: 'phoneNumber' },
            { label: 'Room Number', key: 'roomNumber' },
          ].map(({ label, key }) => (
            <Input key={key} label={label} value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setEditUser(null)}>Cancel</Button>
          <Button className="flex-1" onClick={handleEditSave} loading={editLoading} icon="checkCircle">Save Changes</Button>
        </div>
      </Modal>

      <PageHeader
        title={isFilterLocked ? 'Workers' : 'User Management'}
        subtitle={`${filtered.length} ${isFilterLocked ? 'worker' : 'user'}${filtered.length !== 1 ? 's' : ''} found`}
        action={canCreate && <Button icon="plus" onClick={() => navigate('/admin/users/new')}>Add User</Button>}
      />

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name, email or phone..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500" />
        </div>

        {isFilterLocked ? (
          <div className="flex items-center gap-2 ring-1 ring-emerald-200 bg-emerald-50 rounded-lg px-4 py-2">
            <Icon name="hardhat" size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Workers Only</span>
          </div>
        ) : (
          <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-44">
            {ROLES.map(r => <option key={r} value={r}>{r ? ROLE_META[r]?.label : 'All Roles'}</option>)}
          </Select>
        )}
      </div>

      {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
        <EmptyState icon="users" title="No users found" />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {tableHeaders.map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition ${!u.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="sm" />
                        <span className="font-medium text-slate-800 whitespace-nowrap">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3"><Badge className={ROLE_META[u.role]?.badge}>{ROLE_META[u.role]?.label || u.role}</Badge></td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{u.phoneNumber}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {u.role === 'STUDENT' ? `Block ${u.hostelBlock} / Room ${u.roomNumber}` : u.department || '—'}
                    </td>
                    {showRatingCol && (
                      <td className="px-4 py-3">
                        {u.role === 'WORKER' ? (
                          ratingsLoading ? <Spinner size={16} /> : (
                            <div>
                              <StarDisplay rating={workerStats[u.id]?.averageRating} />
                              {workerStats[u.id] && (
                                <p className="text-xs text-slate-400 mt-0.5">{workerStats[u.id].closed} job{workerStats[u.id].closed !== 1 ? 's' : ''} closed</p>
                              )}
                            </div>
                          )
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Badge tone={u.active ? 'emerald' : 'neutral'}>{u.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {canEdit && (
                          <button onClick={() => handleEditOpen(u)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg transition font-medium whitespace-nowrap">
                            Edit
                          </button>
                        )}
                        {canEdit && (
                          u.active ? (
                            <button onClick={() => handleDeactivate(u.id)} disabled={actionLoading === u.id}
                              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1 rounded-lg transition disabled:opacity-50 font-medium whitespace-nowrap">
                              {actionLoading === u.id ? '...' : 'Deactivate'}
                            </button>
                          ) : (
                            <button onClick={() => handleActivate(u.id)} disabled={actionLoading === u.id}
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg transition disabled:opacity-50 font-medium whitespace-nowrap">
                              {actionLoading === u.id ? '...' : 'Activate'}
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
        </Card>
      )}
    </AppShell>
  );
};

export default UserManagement;
