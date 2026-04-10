import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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


const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
const statusOrder   = { CREATED: 1, ASSIGNED: 2, IN_PROGRESS: 3, RESOLVED: 4, REJECTED: 5, CLOSED: 6 };


const smartSort = (list) => [...list].sort((a, b) => {
  if ((a.overdue || a.escalated) && !(b.overdue || b.escalated)) return -1;
  if (!(a.overdue || a.escalated) && (b.overdue || b.escalated)) return 1;
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


const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button key={star} type="button" onClick={() => onChange(star)}
        className={`text-2xl transition ${star <= value ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}>
        ★
      </button>
    ))}
  </div>
);


const ComplaintList = () => {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const location      = useLocation();

  const [complaints, setComplaints]           = useState([]);
  const [workers, setWorkers]                 = useState([]);
  const [page, setPage]                       = useState(0);
  const [totalPages, setTotalPages]           = useState(0);

  const [statusFilter, setStatusFilter] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('status') || '';
  });

  const [loading, setLoading]                 = useState(true);
  const [actionLoading, setActionLoading]     = useState(null);
  const [selectedWorker, setSelectedWorker]   = useState({});
  const [search, setSearch]                   = useState('');
  const [rejectReason, setRejectReason]       = useState({});
  const [showRejectBox, setShowRejectBox]     = useState({});
  const [showReassignBox, setShowReassignBox] = useState({});

  const [showResolveBox, setShowResolveBox]   = useState({});
  const [resolvePhoto, setResolvePhoto]       = useState({});
  const [uploadingPhoto, setUploadingPhoto]   = useState(null);

  const [closeModal, setCloseModal]           = useState(null);
  const [rating, setRating]                   = useState(0);

  const navigate = useNavigate();
  const isStaff  = ['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role);


  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 10 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/complaints?${params}`);
      setComplaints(smartSort(res.data.content || []));
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);


  useEffect(() => {
    if (isStaff) {
      api.get('/admin/workers')
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
      showToast('Worker assigned successfully!', 'success');
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign', 'error');
    } finally {
      setActionLoading(null);
    }
  };


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


  const handleStartWork = async (complaintId) => {
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/status`, { status: 'IN_PROGRESS' });
      showToast('Status updated to IN PROGRESS', 'success');
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(null);
    }
  };


  const handlePhotoUpload = async (complaintId, file) => {
    if (!file) return;
    setUploadingPhoto(complaintId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // ✅ No manual Content-Type — browser sets it with correct boundary
      const res = await api.post('/files/upload', formData);

      setResolvePhoto(prev => ({ ...prev, [complaintId]: res.data.url }));
      showToast('Photo uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingPhoto(null);
    }
  };


  const handleMarkResolved = async (complaintId) => {
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/status`, {
        status: 'RESOLVED',
        resolvedPhotoUrl: resolvePhoto[complaintId] || null,
      });
      showToast('Complaint marked as resolved!', 'success');
      setShowResolveBox(prev => ({ ...prev, [complaintId]: false }));
      setResolvePhoto(prev => { const n = { ...prev }; delete n[complaintId]; return n; });
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resolve', 'error');
    } finally {
      setActionLoading(null);
    }
  };


  const handleCloseWithRating = async () => {
    if (!closeModal) return;
    setActionLoading(closeModal.id);
    try {
      await api.put(`/complaints/${closeModal.id}/close`, rating > 0 ? { rating } : {});
      showToast('Complaint closed successfully!', 'success');
      setCloseModal(null);
      setRating(0);
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to close complaint', 'error');
    } finally {
      setActionLoading(null);
    }
  };


  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });


  const filtered = complaints.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />


      {/* Close + Rate Modal */}
      {closeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Close Complaint</h3>
            <p className="text-sm text-gray-500 mb-4">
              #{closeModal.id} — {closeModal.title}
            </p>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Rate the work done: <span className="text-gray-400">(optional)</span>
            </p>
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-yellow-600 mt-1 font-medium">
                You selected {rating} star{rating !== 1 ? 's' : ''}
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setCloseModal(null); setRating(0); }}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleCloseWithRating}
                disabled={actionLoading === closeModal.id}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {actionLoading === closeModal.id ? 'Closing...' : '✓ Close Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Complaints
            {statusFilter && (
              <span className={`ml-3 text-sm font-semibold px-3 py-1 rounded-full ${statusColors[statusFilter]}`}>
                {statusFilter}
              </span>
            )}
          </h1>
          <div className="flex gap-3 items-center">
            <select value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
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

        {/* Search */}
        <div className="mb-6 flex items-center gap-3">
          <input type="text"
            placeholder="🔍 Search by title, category or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <span className="text-xs text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>


        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
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
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id}
                className={`bg-white rounded-xl border p-5 hover:shadow-md transition cursor-pointer
                  ${c.overdue    ? 'border-red-300 bg-red-50/30'
                  : c.escalated ? 'border-orange-300 bg-orange-50/30'
                  : 'border-gray-200'}`}
                onClick={() => navigate(`/complaints/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">

                  {/* Left */}
                  <div className="flex-1 min-w-0">
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
                      {c.overdue && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                          🔴 OVERDUE
                        </span>
                      )}
                      {c.escalated && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 animate-pulse">
                          🚨 ESCALATED
                        </span>
                      )}
                      {c.status === 'CLOSED' && c.rating && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          ⭐ {c.rating}/5
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium text-gray-600">{c.category}</span>
                      {' · '}
                      {c.description?.slice(0, 80)}{c.description?.length > 80 ? '...' : ''}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      By: <span className="font-medium text-gray-600">{c.student?.name}</span>
                      {' · '}Block {c.student?.hostelBlock} / Room {c.student?.roomNumber}
                      {c.assignedWorker && (
                        <span className="text-blue-500 font-medium"> · 👷 {c.assignedWorker.name}</span>
                      )}
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                      🕐 {c.createdAt ? formatDate(c.createdAt) : 'N/A'}
                    </p>

                    {c.status === 'REJECTED' && c.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        ❌ Rejected: {c.rejectionReason}
                      </p>
                    )}
                    {c.overdue && (
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        ⚠️ Unresolved for more than 7 days
                      </p>
                    )}
                    {c.escalated && !c.overdue && (
                      <p className="text-xs text-orange-500 mt-1 font-medium">
                        ⚠️ HIGH priority — unassigned for more than 24 hours
                      </p>
                    )}
                    {c.issuePhotoUrl && (
                      <img
                        src={`http://localhost:8080${c.issuePhotoUrl}`}
                        alt="Issue"
                        className="mt-2 h-20 w-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                        onClick={e => { e.stopPropagation(); window.open(`http://localhost:8080${c.issuePhotoUrl}`, '_blank'); }}
                      />
                    )}
                    {c.resolvedPhotoUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={`http://localhost:8080${c.resolvedPhotoUrl}`}
                          alt="Resolved proof"
                          className="h-20 w-32 object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-90"
                          onClick={e => { e.stopPropagation(); window.open(`http://localhost:8080${c.resolvedPhotoUrl}`, '_blank'); }}
                        />
                        <span className="text-xs text-green-600 font-medium">✅ Proof photo</span>
                      </div>
                    )}
                  </div>

                  {/* Right — Actions */}
                  <div className="flex flex-col gap-2 min-w-max" onClick={e => e.stopPropagation()}>

                    {/* STAFF — Assign */}
                    {isStaff && c.status === 'CREATED' && (
                      <div className="flex gap-2 items-center">
                        {workers.length === 0 ? (
                          <span className="text-xs text-red-500">No workers available</span>
                        ) : (
                          <>
                            <select
                              value={selectedWorker[c.id] || ''}
                              onChange={e => setSelectedWorker({ ...selectedWorker, [c.id]: e.target.value })}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                              <option value="">Select Worker</option>
                              {workers.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name} {w.department ? `(${w.department})` : ''}
                                </option>
                              ))}
                            </select>
                            <button onClick={() => handleAssign(c.id)}
                              disabled={actionLoading === c.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                              {actionLoading === c.id ? '...' : 'Assign'}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* STAFF — Reassign */}
                    {isStaff && ['ASSIGNED', 'IN_PROGRESS'].includes(c.status) && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setShowReassignBox(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs px-3 py-1.5 rounded-lg transition">
                          🔄 Reassign
                        </button>
                        {showReassignBox[c.id] && (
                          <div className="flex gap-2 items-center mt-1">
                            <select
                              value={selectedWorker[c.id] || ''}
                              onChange={e => setSelectedWorker({ ...selectedWorker, [c.id]: e.target.value })}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                              <option value="">Select Worker</option>
                              {workers.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name} {w.department ? `(${w.department})` : ''}
                                </option>
                              ))}
                            </select>
                            <button onClick={() => handleReassign(c.id)}
                              disabled={actionLoading === c.id}
                              className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">
                              {actionLoading === c.id ? '...' : 'Confirm'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* STAFF — Reject */}
                    {isStaff && !['CLOSED', 'REJECTED'].includes(c.status) && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setShowRejectBox(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-lg transition">
                          ❌ Reject
                        </button>
                        {showRejectBox[c.id] && (
                          <div className="flex flex-col gap-1 mt-1">
                            <input type="text"
                              placeholder="Reason for rejection..."
                              value={rejectReason[c.id] || ''}
                              onChange={e => setRejectReason(prev => ({ ...prev, [c.id]: e.target.value }))}
                              className="border border-red-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none w-48"
                            />
                            <button onClick={() => handleReject(c.id)}
                              disabled={actionLoading === c.id}
                              className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50">
                              {actionLoading === c.id ? '...' : 'Confirm Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* WORKER — Start Work */}
                    {user.role === 'WORKER' && c.status === 'ASSIGNED' && (
                      <button onClick={() => handleStartWork(c.id)}
                        disabled={actionLoading === c.id}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                        {actionLoading === c.id ? '...' : '▶ Start Work'}
                      </button>
                    )}

                    {/* WORKER — Mark Resolved + Upload Photo */}
                    {user.role === 'WORKER' && c.status === 'IN_PROGRESS' && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setShowResolveBox(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition">
                          ✓ Mark Resolved
                        </button>
                        {showResolveBox[c.id] && (
                          <div className="flex flex-col gap-2 mt-1 p-3 bg-green-50 border border-green-200 rounded-xl w-56">
                            <p className="text-xs font-semibold text-green-700">Upload proof photo (optional)</p>
                            <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition
                              ${resolvePhoto[c.id]
                                ? 'border-green-400 bg-green-100'
                                : 'border-green-300 bg-white hover:bg-green-50'}`}>
                              <span className="text-xl">
                                {resolvePhoto[c.id] ? '✅' : uploadingPhoto === c.id ? '⏳' : '📷'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-green-700">
                                  {resolvePhoto[c.id] ? 'Photo uploaded!'
                                    : uploadingPhoto === c.id ? 'Uploading...'
                                    : 'Choose photo'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {resolvePhoto[c.id]
                                    ? resolvePhoto[c.id].split('/').pop()
                                    : 'JPG, PNG'}
                                </p>
                              </div>
                              <input type="file" accept="image/*" className="hidden"
                                onChange={e => handlePhotoUpload(c.id, e.target.files[0])} />
                            </label>
                            <button onClick={() => handleMarkResolved(c.id)}
                              disabled={actionLoading === c.id || uploadingPhoto === c.id}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg disabled:opacity-50 font-medium transition">
                              {actionLoading === c.id ? 'Saving...' : 'Confirm Resolved'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* STUDENT — Close + Rate */}
                    {user.role === 'STUDENT' && c.status === 'RESOLVED' && (
                      <button
                        onClick={() => { setCloseModal(c); setRating(0); }}
                        disabled={actionLoading === c.id}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                        ✓ Close & Rate
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
          <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition">
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i)
              .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
              .reduce((acc, i, idx, arr) => {
                if (idx > 0 && i - arr[idx - 1] > 1) acc.push('...');
                acc.push(i);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
                ) : (
                  <button key={item} onClick={() => setPage(item)}
                    className={`w-9 h-9 text-sm rounded-lg border transition font-medium
                      ${page === item
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}>
                    {item + 1}
                  </button>
                )
              )
            }

            <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition">
              Next →
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>
      </div>
    </div>
  );
};

export default ComplaintList;
