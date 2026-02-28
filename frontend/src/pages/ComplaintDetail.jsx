import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const statusColors = {
  CREATED: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-purple-100 text-purple-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const priorityColors = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
};

const statusTimeline = [
  'CREATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
];

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
    } catch (err) {
      setError('Complaint not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
    if (['CARETAKER', 'WARDEN'].includes(user.role)) {
      api.get('/users/workers')
        .then(res => setWorkers(res.data))
        .catch(() => {});
    }
  }, [id]);

  const handleAssign = async () => {
    if (!selectedWorker) return alert('Please select a worker');
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/assign`, { workerId: Number(selectedWorker) });
      fetchComplaint();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/status`, { status });
      fetchComplaint();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/close`);
      fetchComplaint();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const currentStep = statusTimeline.indexOf(complaint?.status);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error || !complaint) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-lg font-medium">{error || 'Complaint not found'}</p>
        <button onClick={() => navigate('/complaints')}
          className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm">
          ← Back to Complaints
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back Button */}
        <button onClick={() => navigate('/complaints')}
          className="text-sm text-indigo-600 hover:underline mb-5 flex items-center gap-1">
          ← Back to Complaints
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* LEFT — Main Details */}
          <div className="md:col-span-2 space-y-5">

            {/* Title Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">COMPLAINT #{complaint.id}</p>
                  <h1 className="text-xl font-bold text-gray-800">{complaint.title}</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[complaint.status]}`}>
                    {complaint.status}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${priorityColors[complaint.priority]}`}>
                    {complaint.priority}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-medium">Category</p>
                  <p className="text-gray-700 font-medium mt-0.5">{complaint.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-medium">Submitted On</p>
                  <p className="text-gray-700 font-medium mt-0.5">{formatDate(complaint.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-medium">Last Updated</p>
                  <p className="text-gray-700 font-medium mt-0.5">{formatDate(complaint.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-medium">Room</p>
                  <p className="text-gray-700 font-medium mt-0.5">
                    Block {complaint.student?.hostelBlock} / Room {complaint.student?.roomNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
            </div>

            {/* Photos */}
            {(complaint.issuePhotoUrl || complaint.resolvedPhotoUrl) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Photos</h2>
                <div className="flex gap-4 flex-wrap">
                  {complaint.issuePhotoUrl && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Issue Photo</p>
                      <img
                        src={`http://localhost:8080${complaint.issuePhotoUrl}`}
                        alt="Issue"
                        onClick={() => window.open(`http://localhost:8080${complaint.issuePhotoUrl}`, '_blank')}
                        className="h-40 w-56 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition"
                      />
                    </div>
                  )}
                  {complaint.resolvedPhotoUrl && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Resolution Photo</p>
                      <img
                        src={`http://localhost:8080${complaint.resolvedPhotoUrl}`}
                        alt="Resolved"
                        onClick={() => window.open(`http://localhost:8080${complaint.resolvedPhotoUrl}`, '_blank')}
                        className="h-40 w-56 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Progress</h2>
              <div className="flex items-center gap-0">
                {statusTimeline.map((step, index) => {
                  const isCompleted = currentStep >= index;
                  const isCurrent = currentStep === index;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition
                          ${isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                            : isCompleted ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-400'}`}>
                          {isCompleted && !isCurrent ? '✓' : index + 1}
                        </div>
                        <p className={`text-xs mt-1 text-center font-medium
                          ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                          {step.replace('_', ' ')}
                        </p>
                      </div>
                      {index < statusTimeline.length - 1 && (
                        <div className={`h-0.5 flex-1 mb-5 ${currentStep > index ? 'bg-green-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — People + Actions */}
          <div className="space-y-5">

            {/* Student Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Submitted By</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {complaint.student?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{complaint.student?.name}</p>
                  <p className="text-xs text-gray-400">{complaint.student?.email}</p>
                  <p className="text-xs text-gray-400">{complaint.student?.phoneNumber}</p>
                </div>
              </div>
            </div>

            {/* Worker Info */}
            {complaint.assignedWorker ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Assigned Worker</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">
                    {complaint.assignedWorker?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{complaint.assignedWorker.name}</p>
                    <p className="text-xs text-gray-400">{complaint.assignedWorker.email}</p>
                    <p className="text-xs text-gray-400">{complaint.assignedWorker.department}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-5">
                <p className="text-sm text-yellow-700 font-medium">⏳ No worker assigned yet</p>
              </div>
            )}

            {/* Actions Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase">Actions</h2>

              {/* WARDEN — Assign Worker */}
              {['CARETAKER', 'WARDEN'].includes(user.role) && complaint.status === 'CREATED' && (
                <div className="space-y-2">
                  <select value={selectedWorker}
                    onChange={e => setSelectedWorker(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Worker</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.department ? `(${w.department})` : ''}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleAssign} disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                    {actionLoading ? 'Assigning...' : '👷 Assign Worker'}
                  </button>
                </div>
              )}

              {/* WORKER — Start Work */}
              {user.role === 'WORKER' && complaint.status === 'ASSIGNED' && (
                <button onClick={() => handleStatusUpdate('IN_PROGRESS')}
                  disabled={actionLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                  {actionLoading ? 'Updating...' : '▶ Start Work'}
                </button>
              )}

              {/* WORKER — Mark Resolved */}
              {user.role === 'WORKER' && complaint.status === 'IN_PROGRESS' && (
                <button onClick={() => handleStatusUpdate('RESOLVED')}
                  disabled={actionLoading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                  {actionLoading ? 'Updating...' : '✓ Mark as Resolved'}
                </button>
              )}

              {/* STUDENT — Close */}
              {user.role === 'STUDENT' && complaint.status === 'RESOLVED' && (
                <button onClick={handleClose} disabled={actionLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                  {actionLoading ? 'Closing...' : '✓ Close Complaint'}
                </button>
              )}

              {/* No action available */}
              {['CLOSED', 'REJECTED'].includes(complaint.status) && (
                <p className="text-sm text-gray-400 text-center py-2">
                  {complaint.status === 'CLOSED' ? '✅ Complaint closed' : '❌ Complaint rejected'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
