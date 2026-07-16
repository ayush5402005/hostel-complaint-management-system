import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import CommentSection from '../components/CommentSection';
import AppShell from '../layouts/AppShell';
import { mediaUrl } from '../utils/mediaUrl';
import { STATUS_META, PRIORITY_META, ROLE_META, formatDateTime } from '../utils/statusMeta';
import { Icon, Badge, Card, CardHeader, Button, Select, Textarea, Modal, Avatar, Spinner, EmptyState } from '../components/ui';

const statusTimeline = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-1 justify-center">
    {[1, 2, 3, 4, 5].map(star => (
      <button key={star} type="button"
        onClick={() => !readonly && onChange && onChange(star)}
        className={`transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
        <Icon name="starFilled" size={26} className={star <= value ? 'text-amber-400' : 'text-slate-200'} />
      </button>
    ))}
  </div>
);

const AuditTimeline = ({ complaintId }) => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/complaints/${complaintId}/audit`)
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [complaintId]);

  if (loading) return <Spinner />;
  if (logs.length === 0) return <p className="text-sm text-slate-400 text-center py-3">No activity yet</p>;

  return (
    <div className="space-y-3">
      {logs.map((log, index) => {
        const meta = STATUS_META[log.toStatus] || {};
        const roleMeta = ROLE_META[log.changedByRole] || {};
        return (
          <div key={log.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-50 ring-2 ring-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-500">
                <Icon name={meta.icon || 'clipboard'} size={14} />
              </div>
              {index < logs.length - 1 && <div className="w-0.5 bg-slate-200 flex-1 mt-1 min-h-[20px]" />}
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-800">{log.changedByName}</span>
                <Badge className={roleMeta.badge}>{roleMeta.label || log.changedByRole}</Badge>
                {log.fromStatus ? (
                  <span className="text-xs text-slate-400">
                    {STATUS_META[log.fromStatus]?.label} → <span className="font-medium text-slate-600">{meta.label}</span>
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-600">{meta.label}</span>
                )}
              </div>
              {log.note && <p className="text-xs text-slate-500 mt-0.5">{log.note}</p>}
              <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(log.changedAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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

  const [showResolveBox, setShowResolveBox]   = useState(false);
  const [resolvePhotoUrl, setResolvePhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto]   = useState(false);

  const [showCloseModal, setShowCloseModal]   = useState(false);
  const [ratingValue, setRatingValue]         = useState(0);

  const fetchComplaint = useCallback(async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
    } catch {
      setError('Complaint not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
    if (['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role)) {
      api.get('/admin/workers').then(res => setWorkers(res.data)).catch(() => {});
    }
  }, [fetchComplaint, user.role]);

  const handleAssign = async () => {
    if (!selectedWorker) { showToast('Please select a worker', 'warning'); return; }
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/assign`, { workerId: Number(selectedWorker) });
      showToast('Worker assigned successfully!', 'success');
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign', 'error');
    } finally { setActionLoading(false); }
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
    } finally { setActionLoading(false); }
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
    } finally { setActionLoading(false); }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/files/upload', formData);
      setResolvePhotoUrl(res.data.url);
      showToast('Photo uploaded!', 'success');
    } catch {
      showToast('Failed to upload photo', 'error');
    } finally { setUploadingPhoto(false); }
  };

  const handleMarkResolved = async () => {
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/status`, {
        status: 'RESOLVED',
        resolvedMediaUrls: resolvePhotoUrl ? [resolvePhotoUrl] : [],
      });
      showToast('Complaint marked as resolved!', 'success');
      setShowResolveBox(false);
      setResolvePhotoUrl(null);
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resolve', 'error');
    } finally { setActionLoading(false); }
  };

  const handleCloseWithRating = async () => {
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/close`, ratingValue > 0 ? { rating: ratingValue } : {});
      showToast('Complaint closed successfully!', 'success');
      setShowCloseModal(false);
      setRatingValue(0);
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to close', 'error');
    } finally { setActionLoading(false); }
  };

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      await api.put(`/complaints/${id}/status`, { status: 'IN_PROGRESS' });
      showToast('Status updated to IN PROGRESS', 'success');
      fetchComplaint();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    } finally { setActionLoading(false); }
  };

  const currentStep = statusTimeline.indexOf(complaint?.status);

  if (loading) return <AppShell><Spinner full /></AppShell>;

  if (error || !complaint) return (
    <AppShell>
      <EmptyState
        icon="alertTriangle" title={error || 'Complaint not found'}
        action={<Button icon="arrowLeft" onClick={() => navigate('/complaints')}>Back to Complaints</Button>}
      />
    </AppShell>
  );

  const isOpen = !['CLOSED', 'REJECTED'].includes(complaint.status);
  const statusMeta = STATUS_META[complaint.status] || {};
  const prioMeta = PRIORITY_META[complaint.priority] || {};
  const preferredSlots = [1, 2, 3]
    .map(n => ({ day: complaint[`slot${n}Day`], time: complaint[`slot${n}Time`] }))
    .filter(s => s.day && s.time);

  return (
    <AppShell>
      <Modal
        open={showCloseModal}
        onClose={() => { setShowCloseModal(false); setRatingValue(0); }}
        icon="starFilled"
        title="Close & Rate"
        subtitle={`#${complaint.id} — ${complaint.title}`}
      >
        <p className="text-sm font-semibold text-slate-700 mb-2 text-center">
          Rate the work done <span className="text-slate-400 font-normal">(optional)</span>
        </p>
        <StarRating value={ratingValue} onChange={setRatingValue} />
        {ratingValue > 0 && (
          <p className="text-xs text-amber-600 text-center font-medium mt-2">{ratingValue} star{ratingValue !== 1 ? 's' : ''} selected</p>
        )}
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => { setShowCloseModal(false); setRatingValue(0); }}>Cancel</Button>
          <Button variant="accent" className="flex-1" onClick={handleCloseWithRating} loading={actionLoading} icon="lock">
            Close Complaint
          </Button>
        </div>
      </Modal>

      <button onClick={() => navigate('/complaints')}
        className="text-sm text-indigo-600 hover:text-indigo-700 mb-5 flex items-center gap-1.5 font-medium">
        <Icon name="arrowLeft" size={15} /> Back to Complaints
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <Card>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">COMPLAINT #{complaint.id}</p>
                <h1 className="text-xl font-bold text-slate-800">{complaint.title}</h1>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {complaint.overdue && <Badge tone="rose" icon="alertTriangle" pulse>Overdue</Badge>}
                  {complaint.escalated && <Badge tone="amber" icon="alertTriangle" pulse>Escalated</Badge>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className={statusMeta.badge} icon={statusMeta.icon}>{statusMeta.label}</Badge>
                <Badge className={prioMeta.badge}>{prioMeta.label}</Badge>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">Category</p>
                <p className="text-slate-700 font-medium mt-0.5">{complaint.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">Submitted On</p>
                <p className="text-slate-700 font-medium mt-0.5">{formatDateTime(complaint.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">Last Updated</p>
                <p className="text-slate-700 font-medium mt-0.5">{formatDateTime(complaint.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">Room</p>
                <p className="text-slate-700 font-medium mt-0.5">
                  Block {complaint.student?.hostelBlock} / Room {complaint.student?.roomNumber}
                </p>
              </div>
            </div>
          </Card>

          {complaint.status === 'REJECTED' && complaint.rejectionReason && (
            <Card className="ring-rose-200 bg-rose-50/40">
              <p className="text-sm font-bold text-rose-600 mb-1 flex items-center gap-1.5">
                <Icon name="xCircle" size={15} /> Complaint Rejected
              </p>
              <p className="text-sm text-rose-500">{complaint.rejectionReason}</p>
            </Card>
          )}

          {complaint.status === 'CLOSED' && complaint.rating && (
            <Card className="ring-amber-200 bg-amber-50/40">
              <p className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                <Icon name="starFilled" size={15} /> Student Rating
              </p>
              <StarRating value={complaint.rating} readonly />
              <p className="text-xs text-slate-500 mt-1 text-center">{complaint.rating}/5 stars</p>
            </Card>
          )}

          <Card>
            <CardHeader title="Description" />
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{complaint.description}</p>
          </Card>

          {preferredSlots.length > 0 && (
            <Card>
              <CardHeader title="Preferred Visit Slots" icon={<Icon name="clock" size={14} className="text-slate-400" />} />
              <div className="flex flex-wrap gap-2">
                {preferredSlots.map(({ day, time }, i) => (
                  <Badge key={i} tone="indigo">{day} · {time}</Badge>
                ))}
              </div>
            </Card>
          )}

          {(complaint.mediaUrls?.length > 0 || complaint.resolvedMediaUrls?.length > 0) && (
            <Card>
              <CardHeader title="Photos" />
              <div className="flex gap-4 flex-wrap">
                {complaint.mediaUrls?.map(url => (
                  <div key={url}>
                    <p className="text-xs text-slate-400 mb-1">Issue Photo</p>
                    <img src={mediaUrl(url)} alt="Issue"
                      onClick={() => window.open(mediaUrl(url), '_blank')}
                      className="h-40 w-56 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition" />
                  </div>
                ))}
                {complaint.resolvedMediaUrls?.map(url => (
                  <div key={url}>
                    <p className="text-xs text-slate-400 mb-1">Resolution Photo</p>
                    <img src={mediaUrl(url)} alt="Resolved"
                      onClick={() => window.open(mediaUrl(url), '_blank')}
                      className="h-40 w-56 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Progress" />
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {statusTimeline.map((step, index) => {
                const isCompleted = currentStep >= index;
                const isCurrent   = currentStep === index;
                return (
                  <div key={step} className="flex items-center flex-1 min-w-[64px]">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition flex-shrink-0
                        ${isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {isCompleted && !isCurrent ? <Icon name="checkCircle" size={14} /> : index + 1}
                      </div>
                      <p className={`text-[11px] mt-1.5 text-center font-medium whitespace-nowrap
                        ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {STATUS_META[step]?.label}
                      </p>
                    </div>
                    {index < statusTimeline.length - 1 && (
                      <div className={`h-0.5 flex-1 mb-5 min-w-[16px] ${currentStep > index ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <CommentSection complaintId={id} complaintStatus={complaint.status} />

          <Card>
            <CardHeader title="Activity History" icon={<Icon name="clipboard" size={14} className="text-slate-400" />} />
            <AuditTimeline complaintId={id} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Submitted By" />
            <div className="flex items-center gap-3">
              <Avatar name={complaint.student?.name} size="lg" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{complaint.student?.name}</p>
                <p className="text-xs text-slate-400 truncate">{complaint.student?.email}</p>
                <p className="text-xs text-slate-400">{complaint.student?.phoneNumber}</p>
              </div>
            </div>
          </Card>

          {complaint.assignedWorker ? (
            <Card>
              <CardHeader title="Assigned Worker" />
              <div className="flex items-center gap-3">
                <Avatar name={complaint.assignedWorker?.name} size="lg" tone="bg-emerald-100 text-emerald-700" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{complaint.assignedWorker.name}</p>
                  <p className="text-xs text-slate-400 truncate">{complaint.assignedWorker.email}</p>
                  <p className="text-xs text-slate-400">{complaint.assignedWorker.department}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="ring-amber-200 bg-amber-50/40">
              <p className="text-sm text-amber-700 font-medium flex items-center gap-1.5">
                <Icon name="clock" size={15} /> No worker assigned yet
              </p>
            </Card>
          )}

          <Card className="space-y-3">
            <CardHeader title="Actions" />

            {['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role) && complaint.status === 'CREATED' && (
              <div className="space-y-2">
                <Select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)}>
                  <option value="">Select Worker</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name} {w.department ? `(${w.department})` : ''}</option>)}
                </Select>
                <Button className="w-full" icon="hardhat" onClick={handleAssign} loading={actionLoading}>Assign Worker</Button>
              </div>
            )}

            {['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role) && ['ASSIGNED', 'IN_PROGRESS'].includes(complaint.status) && (
              <div className="space-y-2">
                <Button variant="subtle" className="w-full" icon="refresh" onClick={() => setShowReassignBox(r => !r)}>Reassign Worker</Button>
                {showReassignBox && (
                  <div className="space-y-2 pt-1">
                    <Select value={reassignWorker} onChange={e => setReassignWorker(e.target.value)}>
                      <option value="">Select New Worker</option>
                      {workers.map(w => <option key={w.id} value={w.id}>{w.name} {w.department ? `(${w.department})` : ''}</option>)}
                    </Select>
                    <Button className="w-full" onClick={handleReassign} loading={actionLoading}>Confirm Reassign</Button>
                  </div>
                )}
              </div>
            )}

            {['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role) && isOpen && (
              <div className="space-y-2">
                <Button variant="danger" className="w-full" icon="xCircle" onClick={() => setShowRejectBox(r => !r)}>Reject Complaint</Button>
                {showRejectBox && (
                  <div className="space-y-2 pt-1">
                    <Textarea rows={3} placeholder="Enter reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                    <Button variant="dangerFill" className="w-full" onClick={handleReject} loading={actionLoading}>Confirm Rejection</Button>
                  </div>
                )}
              </div>
            )}

            {user.role === 'WORKER' && complaint.status === 'ASSIGNED' && (
              <Button variant="warning" className="w-full" icon="wrench" onClick={handleStartWork} loading={actionLoading}>
                Start Work
              </Button>
            )}

            {user.role === 'WORKER' && complaint.status === 'IN_PROGRESS' && (
              <div className="space-y-2">
                <Button variant="success" className="w-full" icon="checkCircle" onClick={() => setShowResolveBox(r => !r)}>
                  Mark as Resolved
                </Button>
                {showResolveBox && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-emerald-700">Upload proof photo (optional)</p>
                    <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition
                      ${resolvePhotoUrl ? 'border-emerald-400 bg-emerald-100' : 'border-emerald-300 bg-white hover:bg-emerald-50'}`}>
                      <Icon name={resolvePhotoUrl ? 'checkCircle' : uploadingPhoto ? 'loader' : 'image'} size={22}
                        className={`text-emerald-600 flex-shrink-0 ${uploadingPhoto ? 'animate-spin' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-700">
                          {resolvePhotoUrl ? 'Photo uploaded!' : uploadingPhoto ? 'Uploading...' : 'Choose photo'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {resolvePhotoUrl ? resolvePhotoUrl.split('/').pop() : 'JPG, PNG up to 10MB'}
                        </p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e.target.files[0])} />
                    </label>
                    <Button variant="success" className="w-full" onClick={handleMarkResolved} loading={actionLoading || uploadingPhoto}>
                      Confirm Resolved
                    </Button>
                  </div>
                )}
              </div>
            )}

            {user.role === 'STUDENT' && complaint.status === 'RESOLVED' && (
              <Button variant="accent" className="w-full" icon="lock" onClick={() => setShowCloseModal(true)} loading={actionLoading}>
                Close & Rate
              </Button>
            )}

            {['CLOSED', 'REJECTED'].includes(complaint.status) && (
              <p className="text-sm text-slate-400 text-center py-2 flex items-center justify-center gap-1.5">
                <Icon name={complaint.status === 'CLOSED' ? 'lock' : 'xCircle'} size={14} />
                {complaint.status === 'CLOSED' ? 'Complaint closed' : 'Complaint rejected'}
              </p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default ComplaintDetail;
