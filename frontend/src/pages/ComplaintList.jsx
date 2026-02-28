import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const STATUSES = ['', 'CREATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

const statusColors = {
  CREATED: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-purple-100 text-purple-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const priorityColors = {
  LOW: 'text-green-600',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-red-600',
};

const ComplaintList = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState({});
  const navigate = useNavigate();


  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 10 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/complaints?${params}`);
      setComplaints(res.data.content || []);
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
    if (!workerId) return alert('Please select a worker first');
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/assign`, { workerId: Number(workerId) });
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (complaintId, status) => {
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/status`, { status });
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (complaintId) => {
    setActionLoading(complaintId);
    try {
      await api.put(`/complaints/${complaintId}/close`);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close complaint');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>

        /* Empty State */
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-lg font-medium">No complaints found</p>
            {user.role === 'STUDENT' && (
              <Link to="/complaints/new"
                className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
                Create your first complaint
              </Link>
            )}
          </div>

        /* Complaint Cards */
        ) : (
          <div className="space-y-3">
            {complaints.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
  onClick={() => navigate(`/complaints/${c.id}`)}>

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

                    {/* Issue Photo */}
                    {c.issuePhotoUrl && (
                      <img
                        src={`http://localhost:8080${c.issuePhotoUrl}`}
                        alt="Issue"
                        className="mt-2 h-20 w-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                        onClick={() => window.open(`http://localhost:8080${c.issuePhotoUrl}`, '_blank')}
                      />
                    )}
                  </div>

                  {/* Right — Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-max">

                    {/* WARDEN/CARETAKER — Assign Worker Dropdown */}
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

      </div>
    </div>
  );
};

export default ComplaintList;
