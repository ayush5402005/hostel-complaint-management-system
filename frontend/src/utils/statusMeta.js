// Single source of truth for how complaint status / priority / role are
// labeled and colored across the entire app — every page must import from
// here rather than defining its own color map, so a status always looks the
// same everywhere (KPI cards, badges, tables, filters, detail pages).
export const STATUS_ORDER = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'DISPUTED', 'CLOSED', 'REJECTED'];

export const STATUS_META = {
  CREATED:     { label: 'Pending',     icon: 'clock',       badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',      solid: 'bg-slate-500',   dot: 'bg-slate-400' },
  ASSIGNED:    { label: 'Assigned',    icon: 'user',        badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',          solid: 'bg-blue-500',    dot: 'bg-blue-500' },
  IN_PROGRESS: { label: 'In Progress', icon: 'wrench',      badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',       solid: 'bg-amber-500',   dot: 'bg-amber-500' },
  RESOLVED:    { label: 'Resolved',    icon: 'checkCircle', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', solid: 'bg-emerald-500', dot: 'bg-emerald-500' },
  DISPUTED:    { label: 'Disputed',    icon: 'flag',        badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',    solid: 'bg-orange-500',  dot: 'bg-orange-500' },
  CLOSED:      { label: 'Closed',      icon: 'lock',        badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',    solid: 'bg-violet-500',  dot: 'bg-violet-500' },
  REJECTED:    { label: 'Rejected',    icon: 'xCircle',     badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',          solid: 'bg-rose-500',    dot: 'bg-rose-500' },
};

export const PRIORITY_META = {
  LOW:    { label: 'Low',    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  MEDIUM: { label: 'Medium', badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  HIGH:   { label: 'High',   badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
};

export const ROLE_META = {
  ADMIN:         { label: 'Admin',         badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
  WARDEN:        { label: 'Warden',        badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  CARETAKER:     { label: 'Caretaker',     badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  WORKER:        { label: 'Worker',        badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  STUDENT:       { label: 'Student',       badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  MESS_CONVENOR: { label: 'Mess Convenor', badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
};

export const statusLabel = (status) => STATUS_META[status]?.label || status;
export const statusBadgeClass = (status) => STATUS_META[status]?.badge || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};
