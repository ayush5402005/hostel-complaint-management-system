import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [workerIdInput, setWorkerIdInput] = useState({});

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

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleAssign = async (complaintId) => {
    const workerId = workerIdInput[complaintId];
    if (!workerId) return alert('Enter Worker ID first');
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
      alert(err.response?.data?.message || 'Failed to update');
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
      alert(err.response?.data?.message || 'Failed to close');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
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

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>No complaints found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">#{c.id} — {c.title}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                      <span className={`text-xs font-semibold ${priorityColors[c.priority]}`}>
                        ↑ {c.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {c.category} · {c.description?.slice(0, 80)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      By: {c.student?.name} · Block {c.student?.hostelBlock} / Room {c.student?.roomNumber}
                      {c.assignedWorker && ` · Worker: ${c.assignedWorker.name}`}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 min-w-max">
                    {['CARETAKER', 'WARDEN'].includes(user.role) && c.status === 'CREATED' && (
                      <div className="flex gap-2">
                        <input
                          type="number" placeholder="Worker ID"
                          value={workerIdInput[c.id] || ''}
                          onChange={e => setWorkerIdInput({ ...workerIdInput, [c.id]: e.target.value })}
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button onClick={() => handleAssign(c.id)}
                          disabled={actionLoading === c.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                          {actionLoading === c.id ? '...' : 'Assign'}
                        </button>
                      </div>
                    )}

                    {user.role === 'WORKER' && c.status === 'ASSIGNED' && (
                      <button onClick={() => handleStatusUpdate(c.id, 'IN_PROGRESS')}
                        disabled={actionLoading === c.id}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {actionLoading === c.id ? '...' : '▶ Start Work'}
                      </button>
                    )}

                    {user.role === 'WORKER' && c.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleStatusUpdate(c.id, 'RESOLVED')}
                        disabled={actionLoading === c.id}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {actionLoading === c.id ? '...' : '✓ Mark Resolved'}
                      </button>
                    )}

                    {user.role === 'STUDENT' && c.status === 'RESOLVED' && (
                      <button onClick={() => handleClose(c.id)}
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
