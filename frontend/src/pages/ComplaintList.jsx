import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const STATUSES = ['', 'CREATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

const statusColors = {
  CREATED:     'bg-gray-100 text-gray-700',
  ASSIGNED:    'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED:    'bg-green-100 text-green-700',
  CLOSED:      'bg-purple-100 text-purple-700',
  REJECTED:    'bg-red-100 text-red-700',
};

const priorityColors = {
  LOW:    'text-green-600',
  MEDIUM: 'text-yellow-600',
  HIGH:   'text-red-600',
};

// ✅ NEW — smart sort: active + high priority first, closed/rejected last
const priorityOrder  = { HIGH: 1, MEDIUM: 2, LOW: 3 };
const statusOrder    = { CREATED: 1, ASSIGNED: 2, IN_PROGRESS: 3, RESOLVED: 4, REJECTED: 5, CLOSED: 6 };

const smartSort = (list) => [...list].sort((a, b) => {
  const aActive = ['CREATED', 'ASSIGNED', 'IN_PROGRESS'].includes(a.status);
  const bActive = ['CREATED', 'ASSIGNED', 'IN_PROGRESS'].includes(b.status);
  if (aActive && !bActive) return -1;
  if (!aActive && bActive) return 1;
  if (aActive && bActive) {
    const pDiff = (priorityOrder[a.priority] || 9) - (priorityOrder[b.priority] || 9);
    if (pDiff !== 0) return pDiff;
  }
  return (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9);
});

const ComplaintList = () => {
  const { user }        = useAuth();
  const { showToast }   = useToast(); // ✅ NEW — replace all alert()
  const [complaints, setComplaints]       = useState([]);
  const [workers, setWorkers]             = useState([]);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [statusFilter, setStatusFilter]   = useState('');
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState({});
  // ✅ NEW — search + reject state
  const [search, setSearch]               = useState('');
  const [rejectReason, setRejectReason]   = useState({});
  const [showRejectBox, setShowRejectBox] = useState({});
  const [showReassignBox, setShowReassignBox] = useState({});
  const navigate = useNavigate();

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 10 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/complaints?${params}`);
      // ✅ NEW — apply smart sort after fetching
      setComplaints(smartSort(res.data.content || []));
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (['CARETAKER', 'WARDEN'].includes(user.role)) {
      api.get('/users/workers')
        .then(res => setWorkers(res.data))
        .catch(err => console.error(err));
    }
  }, [user.role]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleAssign = async (complaintId) => {
    const workerId = selectedWorker[complaintId];
    if (!workerId) { showToast('Please select a worker first', 'warning'); return; }
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/assign`, { workerId: Number(workerId) });
      showToast('Worker assigned successfully!', 'success'); // ✅ NEW
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign', 'error'); // ✅ NEW
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ NEW — Reassign worker (S5)
  const handleReassign = async (complaintId) => {
    const workerId = selectedWorker[complaintId];
    if (!workerId) { showToast('Please select a worker first', 'warning'); return; }
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/reassign`, { workerId: Number(workerId) });
      showToast('Worker reassigned successfully!', 'success');
      setShowReassignBox({});
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reassign', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ NEW — Reject complaint (S1)
  const handleReject = async (complaintId) => {
    const reason = rejectReason[complaintId];
    if (!reason?.trim()) { showToast('Please enter a rejection reason', 'warning'); return; }
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/reject`, { reason });
      showToast('Complaint rejected', 'success');
      setShowRejectBox({});
      setRejectReason({});
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (complaintId, status) => {
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/status`, { status });
      showToast(`Status updated to ${status.replace('_', ' ')}`, 'success'); // ✅ NEW
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error'); // ✅ NEW
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (complaintId) => {
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/close`);
      showToast('Complaint closed successfully!', 'success'); // ✅ NEW
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to close complaint', 'error'); // ✅ NEW
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // ✅ NEW — filter by search keyword on current page
  const filtered = complaints.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Complaints</h1>
          <div className="flex gap-3 items-center">
            <select value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s || 'All Status'}</option>
              ))}
            </select>
            {user.role === 'STUDENT' && (
              <Link to="/complaints/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                + New
              </Link>
            )}
          </div>
        </div>

        {/* ✅ NEW — Search bar */}
        <div className="mb-6 flex items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Search by title, category or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>

        /* Empty State */
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-lg font-medium">
              {search ? 'No complaints match your search' : 'No complaints found'}
            </p>
            {user.role === 'STUDENT' && !search && (
              <Link to="/complaints/new"
                className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
                Create your first complaint
              </Link>
            )}
          </div>

        /* Complaint Cards */
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/complaints/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">

                  {/* Left — Complaint Info */}
                  <div className="flex-1 min-w-0">

                    {/* Title + Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-base">
                        #{c.id} — {c.title}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                      <span className={`text-xs font-semibold ${priorityColors[c.priority]}`}>
                        ↑ {c.priority}
                      </span>
                    </div>

                    {/* Category + Description */}
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium text-gray-600">{c.category}</span>
                      {' · '}
                      {c.description?.slice(0, 80)}{c.description?.length > 80 ? '...' : ''}
                    </p>

                    {/* Student + Worker Info */}
                    <p className="text-xs text-gray-400 mt-1">
                      By: <span className="font-medium text-gray-600">{c.student?.name}</span>
                      {' · '}Block {c.student?.hostelBlock} / Room {c.student?.roomNumber}
                      {c.assignedWorker && (
                        <span className="text-blue-500 font-medium"> · 👷 {c.assignedWorker.name}</span>
                      )}
                    </p>

                    {/* Date */}
                    <p className="text-xs text-gray-400 mt-0.5">
                      🕐 {c.createdAt ? formatDate(c.createdAt) : 'N/A'}
                    </p>

                    {/* ✅ NEW — Rejection reason visible to all */}
                    {c.status === 'REJECTED' && c.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        ❌ Rejected: {c.rejectionReason}
                      </p>
                    )}

                    {/* Issue Photo */}
                    {c.issuePhotoUrl && (
                      <img
                        src={`http://localhost:8080${c.issuePhotoUrl}`}
                        alt="Issue"
                        className="mt-2 h-20 w-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                        onClick={e => { e.stopPropagation(); window.open(`http://localhost:8080${c.issuePhotoUrl}`, '_blank'); }}
                      />
                    )}
                  </div>

                  {/* Right — Action Buttons */}
                  <div
                    className="flex flex-col gap-2 min-w-max"
                    onClick={e => e.stopPropagation()}
                  >

                    {/* WARDEN/CARETAKER — Assign Worker */}
                    {['CARETAKER', 'WARDEN'].includes(user.role) && c.status === 'CREATED' && (
                      <div className="flex gap-2 items-center">
                        {workers.length === 0 ? (
                          <span className="text-xs text-red-500">No workers registered</span>
                        ) : (
                          <>
                            <select
                              value={selectedWorker[c.id] || ''}
                              onChange={e => setSelectedWorker({ ...selectedWorker, [c.id]: e.target.value })}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select Worker</option>
                              {workers.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name} {w.department ? `(${w.department})` : ''}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssign(c.id)}
                              disabled={actionLoading === c.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                            >
                              {actionLoading === c.id ? '...' : 'Assign'}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* ✅ NEW — WARDEN/CARETAKER — Reassign Worker (S5) */}
                    {['CARETAKER', 'WARDEN'].includes(user.role) &&
                      ['ASSIGNED', 'IN_PROGRESS'].includes(c.status) && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setShowReassignBox(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          🔄 Reassign
                        </button>
                        {showReassignBox[c.id] && (
                          <div className="flex gap-2 items-center mt-1">
                            <select
                              value={selectedWorker[c.id] || ''}
                              onChange={e => setSelectedWorker({ ...selectedWorker, [c.id]: e.target.value })}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                            >
                              <option value="">Select Worker</option>
                              {workers.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name} {w.department ? `(${w.department})` : ''}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleReassign(c.id)}
                              disabled={actionLoading === c.id}
                              className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                            >
                              {actionLoading === c.id ? '...' : 'Confirm'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ✅ NEW — WARDEN/CARETAKER — Reject complaint (S1) */}
                    {['CARETAKER', 'WARDEN'].includes(user.role) &&
                      !['CLOSED', 'REJECTED'].includes(c.status) && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setShowRejectBox(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          ❌ Reject
                        </button>
                        {showRejectBox[c.id] && (
                          <div className="flex flex-col gap-1 mt-1">
                            <input
                              type="text"
                              placeholder="Reason for rejection..."
                              value={rejectReason[c.id] || ''}
                              onChange={e => setRejectReason(prev => ({ ...prev, [c.id]: e.target.value }))}
                              className="border border-red-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 w-48"
                            />
                            <button
                              onClick={() => handleReject(c.id)}
                              disabled={actionLoading === c.id}
                              className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                            >
                              {actionLoading === c.id ? '...' : 'Confirm Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* WORKER — Start Work */}
                    {user.role === 'WORKER' && c.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStatusUpdate(c.id, 'IN_PROGRESS')}
                        disabled={actionLoading === c.id}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {actionLoading === c.id ? '...' : '▶ Start Work'}
                      </button>
                    )}

                    {/* WORKER — Mark Resolved */}
                    {user.role === 'WORKER' && c.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusUpdate(c.id, 'RESOLVED')}
                        disabled={actionLoading === c.id}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {actionLoading === c.id ? '...' : '✓ Mark Resolved'}
                      </button>
                    )}

                    {/* STUDENT — Close Complaint */}
                    {user.role === 'STUDENT' && c.status === 'RESOLVED' && (
                      <button
                        onClick={() => handleClose(c.id)}
                        disabled={actionLoading === c.id}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {actionLoading === c.id ? '...' : '✓ Close'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100">
              ← Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100">
              Next →
            </button>
          </div>
        )}

        {/* ✅ NEW — Footer */}
        <p className="text-center text-xs text-gray-400 mt-10">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>

      </div>
    </div>
  );
};

export default ComplaintList;
