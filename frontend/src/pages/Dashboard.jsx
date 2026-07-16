import { useEffect, useState, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import AppShell from '../layouts/AppShell';
import { Icon, Badge, Card, EmptyState, Spinner, StatCard, SkeletonStatRow, SkeletonList } from '../components/ui';
import { STATUS_META, PRIORITY_META, formatDate } from '../utils/statusMeta';

const NoticeWidget = memo(function NoticeWidget() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notices')
      .then(res => setNotices(res.data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="bg-slate-900 px-4 py-3.5 flex items-center gap-2">
        <Icon name="megaphone" size={15} className="text-indigo-300" />
        <h3 className="text-white font-bold text-sm">Notice Board</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="p-4 space-y-2">
            <div className="h-3 bg-slate-100 rounded w-3/4 animate-skeleton" />
            <div className="h-3 bg-slate-100 rounded w-1/2 animate-skeleton" />
          </div>
        ) : notices.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No notices yet</p>
        ) : (
          notices.map(n => (
            <Link to={`/notices/${n.id}`} key={n.id} className="block px-4 py-3 hover:bg-slate-50 transition">
              <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                <Icon name="pin" size={12} className="text-indigo-400 flex-shrink-0" /> {n.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {n.postedByName} · {formatDate(n.createdAt)}
              </p>
            </Link>
          ))
        )}
      </div>
      <button
        onClick={() => navigate('/notices')}
        className="w-full text-sm text-indigo-600 font-semibold py-2.5 border-t border-slate-100 hover:bg-indigo-50 transition"
      >
        See All Notices →
      </button>
    </Card>
  );
});

const StarRating = ({ rating }) => {
  if (!rating) return <span className="text-xs text-slate-400">No ratings yet</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Icon key={star} name="starFilled" size={16}
          className={star <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'} />
      ))}
      <span className="text-sm font-semibold text-slate-700 ml-1">{rating}/5</span>
    </div>
  );
};

const UrgentComplaintsWidget = ({ complaints }) => {
  const navigate = useNavigate();
  const urgent = complaints.filter(c => c.overdue || c.escalated).slice(0, 4);

  if (urgent.length === 0) return (
    <EmptyState icon="checkCircle" title="No urgent complaints" description="All complaints are on track" />
  );

  return (
    <div className="space-y-2.5">
      {urgent.map(c => {
        const meta = STATUS_META[c.status] || {};
        return (
          <Card key={c.id} hover onClick={() => navigate(`/complaints/${c.id}`)}
            className={`${c.overdue ? 'ring-rose-200 bg-rose-50/40' : 'ring-amber-200 bg-amber-50/40'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">#{c.id} — {c.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {c.category} · <span className="font-medium">{PRIORITY_META[c.priority]?.label}</span>
                </p>
                {c.assignedWorker && (
                  <p className="text-xs text-blue-500 mt-0.5 flex items-center gap-1">
                    <Icon name="hardhat" size={11} /> {c.assignedWorker.name}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {c.overdue && <Badge tone="rose" icon="alertTriangle" pulse>Overdue</Badge>}
                {c.escalated && !c.overdue && <Badge tone="amber" icon="alertTriangle" pulse>Escalated</Badge>}
                <Badge className={meta.badge}>{meta.label}</Badge>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const ActionCard = ({ to, icon, title, desc }) => (
  <Link to={to} className="bg-white ring-1 ring-slate-200/80 hover:ring-indigo-300 hover:shadow-md rounded-2xl p-4 flex items-center gap-3.5 transition group">
    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
      <Icon name={icon} size={18} />
    </div>
    <div className="min-w-0">
      <p className="font-semibold text-slate-800 text-sm">{title}</p>
      <p className="text-xs text-slate-500 truncate">{desc}</p>
    </div>
  </Link>
);

const ComplaintRow = ({ c }) => {
  const meta = STATUS_META[c.status] || {};
  return (
    <Link to={`/complaints/${c.id}`}
      className="bg-white ring-1 ring-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 hover:ring-indigo-300 hover:shadow-sm transition">
      <div className="min-w-0">
        <p className="font-medium text-slate-800 truncate">{c.title}</p>
        <p className="text-sm text-slate-500 mt-0.5">{c.category} · {PRIORITY_META[c.priority]?.label}</p>
        {c.status === 'REJECTED' && c.rejectionReason && (
          <p className="text-xs text-rose-500 mt-1 truncate">{c.rejectionReason}</p>
        )}
      </div>
      <Badge className={meta.badge} icon={meta.icon}>{meta.label}</Badge>
    </Link>
  );
};

const SectionTitle = ({ icon, children, count, tone = 'rose' }) => (
  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
    <Icon name={icon} size={17} className="text-slate-400" />
    {children}
    {count > 0 && <Badge tone={tone}>{count}</Badge>}
  </h2>
);

// Maps the (now-fixed) /complaints/dashboard response 1:1 by field name —
// see backend DashboardStatsResponse.java for the source of these keys.
const StaffStatCards = ({ stats, navigate }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
    <StatCard label="Total"       value={stats.total}      icon="clipboard"   tone="indigo"  onClick={() => navigate('/complaints')} />
    <StatCard label="Pending"     value={stats.created}    icon="clock"       tone="slate"   onClick={() => navigate('/complaints?status=CREATED')} />
    <StatCard label="Assigned"    value={stats.assigned}   icon="user"        tone="blue"    onClick={() => navigate('/complaints?status=ASSIGNED')} />
    <StatCard label="In Progress" value={stats.inProgress} icon="wrench"      tone="amber"   onClick={() => navigate('/complaints?status=IN_PROGRESS')} />
    <StatCard label="Resolved"    value={stats.resolved}   icon="checkCircle" tone="emerald" onClick={() => navigate('/complaints?status=RESOLVED')} />
    <StatCard label="Closed"      value={stats.closed}     icon="lock"        tone="violet"  onClick={() => navigate('/complaints?status=CLOSED')} />
    <StatCard label="Rejected"    value={stats.rejected}   icon="xCircle"     tone="rose"    onClick={() => navigate('/complaints?status=REJECTED')} />
    <StatCard label="Disputed"    value={stats.disputed}   icon="flag"        tone="orange"  onClick={() => navigate('/complaints?status=DISPUTED')} />
  </div>
);

const Dashboard = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [stats, setStats]                 = useState(null);
  const [studentStats, setStudentStats]   = useState(null);
  const [workerStats, setWorkerStats]     = useState(null);
  const [myComplaints, setMyComplaints]   = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role)) {
        const [statsRes, complaintsRes] = await Promise.all([
          api.get('/complaints/dashboard'),
          api.get('/complaints?page=0&size=20'),
        ]);
        setStats(statsRes.data);
        setAllComplaints(complaintsRes.data.content || []);
      } else if (user.role === 'WORKER') {
        const [complaintsRes, workerStatsRes] = await Promise.all([
          api.get('/complaints?page=0&size=5'),
          api.get('/complaints/dashboard/worker'),
        ]);
        setMyComplaints(complaintsRes.data.content || []);
        setWorkerStats(workerStatsRes.data);
      } else if (user.role === 'STUDENT') {
        const [complaintsRes, statsRes] = await Promise.all([
          api.get('/complaints?page=0&size=5'),
          api.get('/complaints/dashboard/student'),
        ]);
        setMyComplaints(complaintsRes.data.content || []);
        setStudentStats(statsRes.data);
      } else {
        const res = await api.get('/complaints?page=0&size=5');
        setMyComplaints(res.data.content || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const urgentCount = allComplaints.filter(c => c.overdue || c.escalated).length;

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">{user.email} · {user.role}</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStatRow count={4} />
          <SkeletonList count={3} />
        </div>
      ) : (
        <>
          {/* ─── ADMIN ─────────────────────────────────────────────────── */}
          {user.role === 'ADMIN' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {stats && (
                  <div>
                    <div className="flex items-baseline justify-between mb-3">
                      <SectionTitle icon="barChart">Complaint Overview</SectionTitle>
                      <span className="text-xs text-slate-400">Click a card to filter</span>
                    </div>
                    <StaffStatCards stats={stats} navigate={navigate} />
                  </div>
                )}
                <div>
                  <SectionTitle icon="wrench">Quick Actions</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <ActionCard to="/admin/users"     icon="users"    title="User Management" desc="View, add, deactivate users" />
                    <ActionCard to="/admin/users/new" icon="plus"     title="Add New User"     desc="Create warden/caretaker/worker" />
                    <ActionCard to="/complaints"      icon="clipboard" title="All Complaints"   desc="Manage all complaints" />
                    <ActionCard to="/notices"         icon="megaphone" title="Notice Board"     desc="Post and manage notices" />
                  </div>
                </div>
                {urgentCount > 0 && (
                  <div>
                    <SectionTitle icon="alertTriangle" count={urgentCount}>Urgent Complaints</SectionTitle>
                    <div className="mt-3"><UrgentComplaintsWidget complaints={allComplaints} /></div>
                  </div>
                )}
              </div>
              <div><NoticeWidget /></div>
            </div>
          )}

          {/* ─── WARDEN / CARETAKER ────────────────────────────────────── */}
          {['WARDEN', 'CARETAKER'].includes(user.role) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {stats && (
                  <div>
                    <div className="flex items-baseline justify-between mb-3">
                      <SectionTitle icon="barChart">
                        {user.role === 'WARDEN' ? 'Hostel Overview' : 'Complaint Overview'}
                      </SectionTitle>
                      <span className="text-xs text-slate-400">Click a card to filter</span>
                    </div>
                    <StaffStatCards stats={stats} navigate={navigate} />
                  </div>
                )}
                <div>
                  <SectionTitle icon="wrench">Quick Actions</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <ActionCard to="/complaints" icon="clipboard" title="All Complaints" desc="Assign, reject, manage" />
                    <ActionCard to="/notices"    icon="megaphone" title="Notice Board"   desc={user.role === 'WARDEN' ? 'Post notices to students' : 'View hostel notices'} />
                    <ActionCard
                      to={user.role === 'CARETAKER' ? '/admin/users?role=WORKER' : '/admin/users'}
                      icon={user.role === 'CARETAKER' ? 'hardhat' : 'users'}
                      title={user.role === 'CARETAKER' ? 'View Workers' : 'All Users'}
                      desc={user.role === 'CARETAKER' ? 'Worker list & ratings' : 'Manage all users'}
                    />
                  </div>
                </div>
                <div>
                  <SectionTitle icon="alertTriangle" count={urgentCount} tone="amber">Needs Attention</SectionTitle>
                  <div className="mt-3"><UrgentComplaintsWidget complaints={allComplaints} /></div>
                  {urgentCount > 4 && (
                    <Link to="/complaints" className="mt-2 inline-block text-sm text-indigo-600 hover:underline font-medium">
                      View all {urgentCount} urgent complaints →
                    </Link>
                  )}
                </div>
              </div>
              <div className="space-y-5">
                <NoticeWidget />
                {stats?.created > 0 && (
                  <Card className="ring-amber-200 bg-amber-50/50">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
                      <Icon name="clock" size={15} /> Unassigned Complaints
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{stats.created}</p>
                    <p className="text-xs text-amber-600/80 mt-1">Waiting for worker assignment</p>
                    <Link to="/complaints?status=CREATED" className="mt-3 inline-block text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition font-semibold">
                      Assign Now →
                    </Link>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ─── WORKER ────────────────────────────────────────────────── */}
          {user.role === 'WORKER' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {workerStats && (
                  <div>
                    <SectionTitle icon="barChart">My Work Overview</SectionTitle>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-3">
                      <StatCard label="Assigned"    value={workerStats.assigned}   icon="user"        tone="blue"    onClick={() => navigate('/complaints?status=ASSIGNED')} />
                      <StatCard label="In Progress" value={workerStats.inProgress} icon="wrench"      tone="amber"   onClick={() => navigate('/complaints?status=IN_PROGRESS')} />
                      <StatCard label="Resolved"    value={workerStats.resolved}   icon="checkCircle" tone="emerald" onClick={() => navigate('/complaints?status=RESOLVED')} />
                      <StatCard label="Closed"      value={workerStats.closed}     icon="lock"        tone="violet"  onClick={() => navigate('/complaints?status=CLOSED')} />
                    </div>
                    <Card className="mt-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                        <Icon name="starFilled" size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">My Average Rating</p>
                        <StarRating rating={workerStats.averageRating} />
                        {workerStats.averageRating && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Based on {workerStats.closed} closed complaint{workerStats.closed !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <SectionTitle icon="wrench">Assigned to Me</SectionTitle>
                  <Link to="/complaints" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                    View All
                  </Link>
                </div>
                {myComplaints.length === 0 ? (
                  <EmptyState icon="wrench" title="No complaints assigned yet" />
                ) : (
                  <div className="space-y-3">
                    {myComplaints.map(c => <ComplaintRow key={c.id} c={c} />)}
                  </div>
                )}
              </div>
              <div><NoticeWidget /></div>
            </div>
          )}

          {/* ─── STUDENT ───────────────────────────────────────────────── */}
          {user.role === 'STUDENT' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {studentStats && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-2">
                    <StatCard label="Total"    value={studentStats.total}    icon="clipboard"   tone="indigo"  onClick={() => navigate('/complaints')} />
                    <StatCard label="Pending"  value={studentStats.pending}  icon="clock"       tone="amber"   onClick={() => navigate('/complaints?status=CREATED')} />
                    <StatCard label="Resolved" value={studentStats.resolved} icon="checkCircle" tone="emerald" onClick={() => navigate('/complaints?status=RESOLVED')} />
                    <StatCard label="Closed"   value={studentStats.closed}   icon="lock"        tone="violet"  onClick={() => navigate('/complaints?status=CLOSED')} />
                    <StatCard label="Rejected" value={studentStats.rejected} icon="xCircle"     tone="rose"    onClick={() => navigate('/complaints?status=REJECTED')} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-800">My Recent Complaints</h2>
                  <div className="flex gap-2">
                    <Link to="/complaints/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5">
                      <Icon name="plus" size={14} /> New Complaint
                    </Link>
                    <Link to="/complaints" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                      View All
                    </Link>
                  </div>
                </div>
                {myComplaints.length === 0 ? (
                  <EmptyState
                    icon="clipboard" title="No complaints yet"
                    action={<Link to="/complaints/new" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Create your first complaint</Link>}
                  />
                ) : (
                  <div className="space-y-3">
                    {myComplaints.map(c => <ComplaintRow key={c.id} c={c} />)}
                  </div>
                )}
              </div>
              <div><NoticeWidget /></div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};

export default Dashboard;
