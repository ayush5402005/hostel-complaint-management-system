import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import AppShell from '../layouts/AppShell';
import { mediaUrl } from '../utils/mediaUrl';
import { STATUS_META, PRIORITY_META, STATUS_ORDER, formatDateTime } from '../utils/statusMeta';
import { Icon, Badge, Button, Input, Select, Modal, EmptyState, SkeletonList, PageHeader } from '../components/ui';

const STATUSES = ['', ...STATUS_ORDER];

const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
const statusOrder = Object.fromEntries(STATUS_ORDER.map((s, i) => [s, i + 1]));

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
  <div className="flex gap-1 justify-center">
    {[1, 2, 3, 4, 5].map(star => (
      <button key={star} type="button" onClick={() => onChange(star)} className="transition hover:scale-110">
        <Icon name="starFilled" size={28} className={star <= value ? 'text-amber-400' : 'text-slate-200'} />
      </button>
    ))}
  </div>
);

const WorkerPicker = ({ workers, value, onChange, onConfirm, loading, label = 'Assign' }) => (
  <div className="flex gap-2 items-center flex-wrap">
    {workers.length === 0 ? (
      <span className="text-xs text-rose-500">No workers available</span>
    ) : (
      <>
        <Select value={value} onChange={e => onChange(e.target.value)} className="!py-1.5 !text-xs w-40">
          <option value="">Select Worker</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name} {w.department ? `(${w.department})` : ''}</option>)}
        </Select>
        <Button size="sm" onClick={onConfirm} loading={loading}>{label}</Button>
      </>
    )}
  </div>
);

const ComplaintCard = ({ c, onNavigate, actions }) => {
  const meta = STATUS_META[c.status] || {};
  const prio = PRIORITY_META[c.priority] || {};

  return (
    <div
      className={`bg-white rounded-2xl ring-1 p-5 hover:shadow-md transition cursor-pointer
        ${c.overdue ? 'ring-rose-200 bg-rose-50/30' : c.escalated ? 'ring-amber-200 bg-amber-50/30' : 'ring-slate-200/80'}`}
      onClick={onNavigate}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-base">#{c.id} — {c.title}</span>
            <Badge className={meta.badge} icon={meta.icon}>{meta.label}</Badge>
            <Badge className={prio.badge}>{prio.label}</Badge>
            {c.overdue && <Badge tone="rose" icon="alertTriangle" pulse>Overdue</Badge>}
            {c.escalated && <Badge tone="amber" icon="alertTriangle" pulse>Escalated</Badge>}
            {c.status === 'CLOSED' && c.rating && (
              <Badge tone="amber" icon="starFilled">{c.rating}/5</Badge>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-1.5">
            <span className="font-medium text-slate-600">{c.category}</span>
            {' · '}{c.description?.slice(0, 80)}{c.description?.length > 80 ? '...' : ''}
          </p>

          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1 flex-wrap">
            <Icon name="user" size={11} /> {c.student?.name}
            <span>· Block {c.student?.hostelBlock} / Room {c.student?.roomNumber}</span>
            {c.assignedWorker && (
              <span className="text-blue-500 font-medium flex items-center gap-1">
                · <Icon name="hardhat" size={11} /> {c.assignedWorker.name}
              </span>
            )}
          </p>

          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Icon name="clock" size={11} /> {c.createdAt ? formatDateTime(c.createdAt) : 'N/A'}
          </p>

          {c.status === 'REJECTED' && c.rejectionReason && (
            <p className="text-xs text-rose-500 mt-1 font-medium">Rejected: {c.rejectionReason}</p>
          )}
          {c.overdue && <p className="text-xs text-rose-500 mt-1 font-medium">Unresolved for more than 7 days</p>}
          {c.escalated && !c.overdue && (
            <p className="text-xs text-amber-600 mt-1 font-medium">HIGH priority — unassigned for more than 24 hours</p>
          )}

          <div className="flex gap-2 mt-2 flex-wrap">
            {c.issuePhotoUrl && (
              <img src={mediaUrl(c.issuePhotoUrl)} alt="Issue"
                className="h-20 w-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                onClick={e => { e.stopPropagation(); window.open(mediaUrl(c.issuePhotoUrl), '_blank'); }} />
            )}
            {c.resolvedPhotoUrl && (
              <div className="flex items-center gap-2">
                <img src={mediaUrl(c.resolvedPhotoUrl)} alt="Resolved proof"
                  className="h-20 w-32 object-cover rounded-lg border border-emerald-200 cursor-pointer hover:opacity-90"
                  onClick={e => { e.stopPropagation(); window.open(mediaUrl(c.resolvedPhotoUrl), '_blank'); }} />
                <span className="text-xs text-emerald-600 font-medium">Proof photo</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-max" onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      </div>
    </div>
  );
};

const ComplaintList = () => {
  const { user }       = useAuth();
  const { showToast }  = useToast();
  const navigate        = useNavigate();

  // ✅ URL is the single source of truth for the status filter — reading it
  // via useSearchParams (not a one-time useState initializer) means it stays
  // correct even if the query string changes without a full route remount.
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const [complaints, setComplaints]           = useState([]);
  const [workers, setWorkers]                 = useState([]);
  const [page, setPage]                       = useState(0);
  const [totalPages, setTotalPages]           = useState(0);

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

  const isStaff  = ['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role);

  // Reset to page 0 whenever the status filter changes (via KPI click, link, or dropdown)
  useEffect(() => { setPage(0); }, [statusFilter]);

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
      showToast('Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, showToast]);

  useEffect(() => {
    if (isStaff) {
      api.get('/admin/workers')
        .then(res => setWorkers(res.data))
        .catch(() => showToast('Failed to load workers list', 'error'));
    }
  }, [isStaff, showToast]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const setStatusFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value); else next.delete('status');
    setSearchParams(next);
  };

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

  const filtered = complaints.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell wide>
      <Modal
        open={!!closeModal}
        onClose={() => { setCloseModal(null); setRating(0); }}
        icon="lock"
        title="Close Complaint"
        subtitle={closeModal ? `#${closeModal.id} — ${closeModal.title}` : ''}
      >
        <p className="text-sm font-semibold text-slate-700 mb-2 text-center">
          Rate the work done <span className="text-slate-400 font-normal">(optional)</span>
        </p>
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="text-xs text-amber-600 mt-2 font-medium text-center">
            You selected {rating} star{rating !== 1 ? 's' : ''}
          </p>
        )}
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => { setCloseModal(null); setRating(0); }}>Cancel</Button>
          <Button className="flex-1" onClick={handleCloseWithRating} loading={actionLoading === closeModal?.id} icon="checkCircle">
            Close Complaint
          </Button>
        </div>
      </Modal>

      <PageHeader
        title={<span className="flex items-center gap-3 flex-wrap">Complaints {statusFilter && <Badge className={STATUS_META[statusFilter]?.badge}>{STATUS_META[statusFilter]?.label}</Badge>}</span>}
        action={
          <>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="!py-2 w-40">
              {STATUSES.map(s => <option key={s} value={s}>{s ? STATUS_META[s]?.label : 'All Status'}</option>)}
            </Select>
            {user.role === 'STUDENT' && (
              <Link to="/complaints/new">
                <Button icon="plus">New</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text"
            placeholder="Search by title, category or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
        </div>
        {search && <span className="text-xs text-slate-400 flex-shrink-0">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>}
      </div>

      {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
        <EmptyState
          icon="clipboard"
          title={search ? 'No complaints match your search' : statusFilter ? `No ${STATUS_META[statusFilter]?.label.toLowerCase()} complaints` : 'No complaints found'}
          description={statusFilter && !search ? 'Try a different status filter, or clear it to see everything.' : null}
          action={user.role === 'STUDENT' && !search && !statusFilter && (
            <Link to="/complaints/new"><Button icon="plus">Create your first complaint</Button></Link>
          )}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <ComplaintCard
              key={c.id} c={c}
              onNavigate={() => navigate(`/complaints/${c.id}`)}
              actions={
                <>
                  {isStaff && c.status === 'CREATED' && (
                    <WorkerPicker workers={workers} value={selectedWorker[c.id] || ''}
                      onChange={v => setSelectedWorker({ ...selectedWorker, [c.id]: v })}
                      onConfirm={() => handleAssign(c.id)} loading={actionLoading === c.id} label="Assign" />
                  )}

                  {isStaff && ['ASSIGNED', 'IN_PROGRESS'].includes(c.status) && (
                    <div className="flex flex-col gap-1.5">
                      <Button size="sm" variant="subtle" icon="refresh"
                        onClick={() => setShowReassignBox(prev => ({ ...prev, [c.id]: !prev[c.id] }))}>
                        Reassign
                      </Button>
                      {showReassignBox[c.id] && (
                        <WorkerPicker workers={workers} value={selectedWorker[c.id] || ''}
                          onChange={v => setSelectedWorker({ ...selectedWorker, [c.id]: v })}
                          onConfirm={() => handleReassign(c.id)} loading={actionLoading === c.id} label="Confirm" />
                      )}
                    </div>
                  )}

                  {isStaff && !['CLOSED', 'REJECTED'].includes(c.status) && (
                    <div className="flex flex-col gap-1.5">
                      <Button size="sm" variant="danger" icon="xCircle"
                        onClick={() => setShowRejectBox(prev => ({ ...prev, [c.id]: !prev[c.id] }))}>
                        Reject
                      </Button>
                      {showRejectBox[c.id] && (
                        <div className="flex flex-col gap-1.5">
                          <input type="text" placeholder="Reason for rejection..."
                            value={rejectReason[c.id] || ''}
                            onChange={e => setRejectReason(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="border border-rose-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none w-48" />
                          <Button size="sm" variant="dangerFill" onClick={() => handleReject(c.id)} loading={actionLoading === c.id}>
                            Confirm Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {user.role === 'WORKER' && c.status === 'ASSIGNED' && (
                    <Button size="sm" variant="warning" icon="wrench"
                      onClick={() => handleStartWork(c.id)} loading={actionLoading === c.id}>
                      Start Work
                    </Button>
                  )}

                  {user.role === 'WORKER' && c.status === 'IN_PROGRESS' && (
                    <div className="flex flex-col gap-1.5">
                      <Button size="sm" variant="success" icon="checkCircle"
                        onClick={() => setShowResolveBox(prev => ({ ...prev, [c.id]: !prev[c.id] }))}>
                        Mark Resolved
                      </Button>
                      {showResolveBox[c.id] && (
                        <div className="flex flex-col gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl w-56">
                          <p className="text-xs font-semibold text-emerald-700">Upload proof photo (optional)</p>
                          <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition
                            ${resolvePhoto[c.id] ? 'border-emerald-400 bg-emerald-100' : 'border-emerald-300 bg-white hover:bg-emerald-50'}`}>
                            <Icon name={resolvePhoto[c.id] ? 'checkCircle' : uploadingPhoto === c.id ? 'loader' : 'image'} size={18}
                              className={`text-emerald-600 flex-shrink-0 ${uploadingPhoto === c.id ? 'animate-spin' : ''}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-emerald-700">
                                {resolvePhoto[c.id] ? 'Photo uploaded!' : uploadingPhoto === c.id ? 'Uploading...' : 'Choose photo'}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {resolvePhoto[c.id] ? resolvePhoto[c.id].split('/').pop() : 'JPG, PNG'}
                              </p>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(c.id, e.target.files[0])} />
                          </label>
                          <Button size="sm" variant="success" className="w-full"
                            onClick={() => handleMarkResolved(c.id)} loading={actionLoading === c.id || uploadingPhoto === c.id}>
                            Confirm Resolved
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {user.role === 'STUDENT' && c.status === 'RESOLVED' && (
                    <Button size="sm" variant="accent" icon="lock"
                      onClick={() => { setCloseModal(c); setRating(0); }} loading={actionLoading === c.id}>
                      Close & Rate
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)} icon="chevronLeft">Prev</Button>

          {Array.from({ length: totalPages }, (_, i) => i)
            .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
            .reduce((acc, i, idx, arr) => {
              if (idx > 0 && i - arr[idx - 1] > 1) acc.push('...');
              acc.push(i);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span key={`dots-${idx}`} className="px-2 text-slate-400 text-sm">...</span>
              ) : (
                <button key={item} onClick={() => setPage(item)}
                  className={`w-9 h-9 text-sm rounded-lg ring-1 transition font-medium
                    ${page === item ? 'bg-indigo-600 text-white ring-indigo-600' : 'ring-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                  {item + 1}
                </button>
              )
            )}

          <Button size="sm" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next <Icon name="chevronRight" size={14} />
          </Button>
        </div>
      )}
    </AppShell>
  );
};

export default ComplaintList;
