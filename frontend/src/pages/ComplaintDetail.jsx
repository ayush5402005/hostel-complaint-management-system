import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import CommentSection from '../components/CommentSection';

const statusColors = {
  CREATED:     'bg-gray-100 text-gray-700',
  ASSIGNED:    'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED:    'bg-green-100 text-green-700',
  CLOSED:      'bg-purple-100 text-purple-700',
  REJECTED:    'bg-red-100 text-red-700',
};

const priorityColors = {
  LOW:    'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH:   'bg-red-100 text-red-700',
};

const statusTimeline = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// ── ⭐ Star Rating Component ─────────────────────────────────────────────────
const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => !readonly && onChange && onChange(star)}
        className={`text-2xl transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} 
          ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </button>
    ))}
  </div>
);

// ── 📋 Audit Log Timeline ────────────────────────────────────────────────────
const AuditTimeline = ({ complaintId }) => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/complaints/${complaintId}/audit`)
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [complaintId]);

  const roleColor = (role) => {
    const map = {
      STUDENT:    'bg-indigo-100 text-indigo-700',
      WORKER:     'bg-green-100 text-green-700',
      WARDEN:     'bg-purple-100 text-purple-700',
      CARETAKER:  'bg-orange-100 text-orange-700',
    };
    return map[role] || 'bg-gray-100 text-gray-700';
  };

  const statusIcon = (toStatus) => {
    const map = {
      CREATED:     '📝',
      ASSIGNED:    '👷',
      IN_PROGRESS: '🔧',
      RESOLVED:    '✅',
      CLOSED:      '🔒',
      REJECTED:    '❌',
    };
    return map[toStatus] || '📋';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="flex justify-center py-4">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (logs.length === 0) return (
    <p className="text-sm text-gray-400 text-center py-3">No activity yet</p>
  );

  return (
    <div className="space-y-3">
      {logs.map((log, index) => (
        <div key={log.id} className="flex gap-3">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-sm flex-shrink-0">
              {statusIcon(log.toStatus)}
            </div>
            {index < logs.length - 1 && (
              <div className="w-0.5 bg-gray-200 flex-1 mt-1 min-h-[20px]" />
            )}
          </div>
          {/* Content */}
          <div className="pb-4 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">
                {log.changedByName}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(log.changedByRole)}`}>
                {log.changedByRole}
              </span>
              {log.fromStatus && (
                <span className="text-xs text-gray-400">
                  {log.fromStatus} → <span className="font-medium text-gray-600">{log.toStatus}</span>
                </span>
              )}
              {!log.fromStatus && (
                <span className="text-xs font-medium text-gray-600">{log.toStatus}</span>
              )}
            </div>
            {log.note && (
              <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.changedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ComplaintDetail = () => {
  const { id }        = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const { showToast } = useToast();

  const [complaint, setComplaint]             = useState(null);
  const [workers, setWorkers]                 = useState([]);
  const [selectedWorker, setSelectedWorker]   = useState('');
  const [loading, setLoading]                 = useState(true);
  const [actionLoading, setActionLoading]     = useState(false);
  const [error, setError]                     = useState('');
  const [rejectReason, setRejectReason]       = useState('');
  const [showRejectBox, setShowRejectBox]     = useState(false);
  const [showReassignBox, setShowReassignBox] = useState(false);
  const [reassignWorker, setReassignWorker]   = useState('');

  // ⭐ Rating state
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [ratingValue, setRatingValue]         = useState(0);
  const [ratingComment, setRatingComment]     = useState('');
  const [ratingLoading, setRatingLoading]     = useState(false);
  const [existingRating, setExistingRating]   = useState(null);

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
    } catch {
      setError('Complaint not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchRating = async () => {
    try {
      const res = await api.get(`/complaints/${id}/rating`);
      if (res.data) setExistingRating(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchComplaint();
    fetchRating();
    if (['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role)) {
      api.get('/users/workers')
        .then(res => setWorkers(res.data))
        .catch(() => {});
    }
  }, [id]);

  const handleAssign = async () => {
    if (!selectedWorker) { showToast('Please select a worker', 'warning'); return; }
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/assign`, { workerId: Number(selectedWorker) });
      showToast('Worker assigned successfully!', 'success');
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!reassignWorker) { showToast('Please select a worker', 'warning'); return; }
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/reassign`, { workerId: Number(reassignWorker) });
      showToast('Worker reassigned successfully!', 'success');
      setShowReassignBox(false);
      setReassignWorker('');
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reassign', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Please enter a rejection reason', 'warning'); return; }
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/reject`, { reason: rejectReason });
      showToast('Complaint rejected', 'success');
      setShowRejectBox(false);
      setRejectReason('');
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/status`, { status });
      showToast(`Status updated to ${status.replace('_', ' ')}`, 'success');
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/close`);
      showToast('Complaint closed! Please rate the resolution ⭐', 'success');
      fetchComplaint();
      // Show rating popup after close
      setShowRatingPopup(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to close', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ⭐ Submit rating
  const handleSubmitRating = async () => {
    if (ratingValue === 0) { showToast('Please select a star rating', 'warning'); return; }
    setRatingLoading(true);
    try {
      await api.post(`/complaints/${id}/rating`, {
        rating: ratingValue,
        comment: ratingComment
      });
      showToast('Rating submitted! Thank you ⭐', 'success');
      setShowRatingPopup(false);
      fetchRating();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit rating', 'error');
    } finally {
      setRatingLoading(false);
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

  const isOpen = !['CLOSED', 'REJECTED'].includes(complaint.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ⭐ Rating Popup Modal */}
      {showRatingPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <p className="text-3xl mb-2">⭐</p>
              <h3 className="text-lg font-bold text-gray-800">Rate the Resolution</h3>
              <p className="text-sm text-gray-500 mt-1">How satisfied are you with the work done?</p>
            </div>
            <div className="flex justify-center mb-4">
              <StarRating value={ratingValue} onChange={setRatingValue} />
            </div>
            <textarea
              rows={3}
              placeholder="Optional: Leave a comment about the work..."
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRatingPopup(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={ratingLoading || ratingValue === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {ratingLoading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {/* ✅ OVERDUE + ESCALATED badges */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {complaint.overdue && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 animate-pulse">
                        🔴 OVERDUE
                      </span>
                    )}
                    {complaint.escalated && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700 animate-pulse">
                        🚨 ESCALATED
                      </span>
                    )}
                  </div>
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

            {/* Rejection reason box */}
            {complaint.status === 'REJECTED' && complaint.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-red-600 mb-1">❌ Complaint Rejected</p>
                <p className="text-sm text-red-500">{complaint.rejectionReason}</p>
              </div>
            )}

            {/* ⭐ Existing Rating Box (shown if already rated) */}
            {complaint.status === 'CLOSED' && existingRating && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-yellow-700 mb-2">⭐ Your Rating</p>
                <StarRating value={existingRating.rating} readonly />
                {existingRating.comment && (
                  <p className="text-sm text-gray-600 mt-2 italic">"{existingRating.comment}"</p>
                )}
              </div>
            )}

            {/* ⭐ Rate Now button (closed + no rating yet + student) */}
            {complaint.status === 'CLOSED' && !existingRating &&
              user.role === 'STUDENT' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-yellow-700 mb-2">⭐ Rate the Resolution</p>
                <p className="text-sm text-gray-500 mb-3">You haven't rated this complaint yet.</p>
                <button
                  onClick={() => setShowRatingPopup(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  ⭐ Rate Now
                </button>
              </div>
            )}

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
                  const isCurrent   = currentStep === index;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition
                          ${isCurrent   ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                          : isCompleted ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'}`}>
                          {isCompleted && !isCurrent ? '✓' : index + 1}
                        </div>
                        <p className={`text-xs mt-1 text-center font-medium
                          ${isCurrent   ? 'text-indigo-600'
                          : isCompleted ? 'text-green-600'
                          : 'text-gray-400'}`}>
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

            {/* Comment Section */}
            <CommentSection complaintId={id} />

            {/* ✅ Audit Log Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                📋 Activity History
              </h2>
              <AuditTimeline complaintId={id} />
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

              {/* WARDEN/CARETAKER — Assign Worker */}
              {['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role) && complaint.status === 'CREATED' && (
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

              {/* WARDEN/CARETAKER — Reassign Worker */}
              {['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role) &&
                ['ASSIGNED', 'IN_PROGRESS'].includes(complaint.status) && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowReassignBox(r => !r)}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm font-medium transition"
                  >
                    🔄 Reassign Worker
                  </button>
                  {showReassignBox && (
                    <div className="space-y-2 pt-1">
                      <select value={reassignWorker}
                        onChange={e => setReassignWorker(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select New Worker</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} {w.department ? `(${w.department})` : ''}
                          </option>
                        ))}
                      </select>
                      <button onClick={handleReassign} disabled={actionLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                        {actionLoading ? 'Reassigning...' : 'Confirm Reassign'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* WARDEN/CARETAKER — Reject Complaint */}
              {['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role) && isOpen && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowRejectBox(r => !r)}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium transition"
                  >
                    ❌ Reject Complaint
                  </button>
                  {showRejectBox && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={3}
                        placeholder="Enter reason for rejection..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                      />
                      <button onClick={handleReject} disabled={actionLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                        {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  )}
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

        <p className="text-center text-xs text-gray-400 mt-10">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>

      </div>
    </div>
  );
};

export default ComplaintDetail;
