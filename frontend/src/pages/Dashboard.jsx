import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const StatCard = ({ label, value, color }) => (
  <div className={`rounded-xl p-5 text-white ${color}`}>
    <p className="text-sm opacity-90">{label}</p>
    <p className="text-3xl font-bold mt-1">{value ?? 0}</p>
  </div>
);

const statusColors = {
  CREATED:     'bg-gray-100 text-gray-700',
  ASSIGNED:    'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED:    'bg-green-100 text-green-700',
  CLOSED:      'bg-purple-100 text-purple-700',
  REJECTED:    'bg-red-100 text-red-700',
};

const NoticeWidget = () => {
  const [notices, setNotices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notices')
      .then(res => setNotices(res.data.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-indigo-600 px-4 py-3">
        <h3 className="text-white font-bold text-sm">📋 Notice Board</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {notices.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No notices yet</p>
        ) : (
          notices.map(n => (
            <div key={n.id} className="px-4 py-3">
              <p className="text-sm font-semibold text-gray-800 truncate">📌 {n.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {n.postedByName} · {new Date(n.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => navigate('/notices')}
        className="w-full text-sm text-indigo-600 font-semibold py-2.5 border-t border-gray-100 hover:bg-indigo-50 transition"
      >
        See All Notices →
      </button>
    </div>
  );
};

// ✅ Star rating display
const StarRating = ({ rating }) => {
  if (!rating) return <span className="text-xs text-gray-400">No ratings yet</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={`text-lg ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
      <span className="text-sm font-semibold text-gray-700 ml-1">{rating}/5</span>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]               = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [workerStats, setWorkerStats]   = useState(null);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (['ADMIN', 'CARETAKER', 'WARDEN'].includes(user.role)) {
          const res = await api.get('/complaints/dashboard');
          setStats(res.data);
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
    };
    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{user.email} · {user.role}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ✅ ADMIN VIEW */}
            {user.role === 'ADMIN' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {stats && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-700 mb-3">📊 Complaint Overview</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total"       value={stats.total}      color="bg-indigo-600" />
                        <StatCard label="Created"     value={stats.created}    color="bg-gray-500" />
                        <StatCard label="Assigned"    value={stats.assigned}   color="bg-blue-500" />
                        <StatCard label="In Progress" value={stats.inProgress} color="bg-yellow-500" />
                        <StatCard label="Resolved"    value={stats.resolved}   color="bg-green-500" />
                        <StatCard label="Closed"      value={stats.closed}     color="bg-purple-500" />
                        <StatCard label="Rejected"    value={stats.rejected}   color="bg-red-500" />
                      </div>
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">⚡ Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/admin/users"
                        className="bg-white border border-gray-200 hover:border-indigo-400 rounded-xl p-4 flex items-center gap-3 transition hover:shadow-sm">
                        <span className="text-2xl">👥</span>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">User Management</p>
                          <p className="text-xs text-gray-500">View, add, deactivate users</p>
                        </div>
                      </Link>
                      <Link to="/admin/users/new"
                        className="bg-white border border-gray-200 hover:border-indigo-400 rounded-xl p-4 flex items-center gap-3 transition hover:shadow-sm">
                        <span className="text-2xl">➕</span>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">Add New User</p>
                          <p className="text-xs text-gray-500">Create warden/caretaker/worker</p>
                        </div>
                      </Link>
                      <Link to="/complaints"
                        className="bg-white border border-gray-200 hover:border-indigo-400 rounded-xl p-4 flex items-center gap-3 transition hover:shadow-sm">
                        <span className="text-2xl">📋</span>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">All Complaints</p>
                          <p className="text-xs text-gray-500">Manage all complaints</p>
                        </div>
                      </Link>
                      <Link to="/notices"
                        className="bg-white border border-gray-200 hover:border-indigo-400 rounded-xl p-4 flex items-center gap-3 transition hover:shadow-sm">
                        <span className="text-2xl">📌</span>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">Notice Board</p>
                          <p className="text-xs text-gray-500">Post and manage notices</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <div><NoticeWidget /></div>
              </div>
            )}

            {/* ✅ CARETAKER / WARDEN VIEW */}
            {['CARETAKER', 'WARDEN'].includes(user.role) && stats && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total"       value={stats.total}      color="bg-indigo-600" />
                    <StatCard label="Created"     value={stats.created}    color="bg-gray-500" />
                    <StatCard label="Assigned"    value={stats.assigned}   color="bg-blue-500" />
                    <StatCard label="In Progress" value={stats.inProgress} color="bg-yellow-500" />
                    <StatCard label="Resolved"    value={stats.resolved}   color="bg-green-500" />
                    <StatCard label="Closed"      value={stats.closed}     color="bg-purple-500" />
                    <StatCard label="Rejected"    value={stats.rejected}   color="bg-red-500" />
                  </div>
                  <Link to="/complaints"
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
                    View All Complaints →
                  </Link>
                </div>
                <div><NoticeWidget /></div>
              </div>
            )}

            {/* ✅ WORKER VIEW */}
            {user.role === 'WORKER' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                  {/* Worker Stats */}
                  {workerStats && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-700 mb-3">📊 My Work Overview</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Assigned"    value={workerStats.assigned}   color="bg-blue-500" />
                        <StatCard label="In Progress" value={workerStats.inProgress} color="bg-yellow-500" />
                        <StatCard label="Resolved"    value={workerStats.resolved}   color="bg-green-500" />
                        <StatCard label="Closed"      value={workerStats.closed}     color="bg-purple-500" />
                      </div>

                      {/* Rating Card */}
                      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                        <span className="text-3xl">⭐</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">My Average Rating</p>
                          <StarRating rating={workerStats.averageRating} />
                          {workerStats.averageRating && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Based on {workerStats.closed} closed complaint{workerStats.closed !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Assigned Complaints */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-700">🔧 Assigned to Me</h2>
                    <Link to="/complaints"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                      View All
                    </Link>
                  </div>

                  {myComplaints.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                      <p className="text-4xl mb-3">🔧</p>
                      <p>No complaints assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myComplaints.map(c => (
                        <Link key={c.id} to={`/complaints/${c.id}`}
                          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-indigo-300 transition block">
                          <div>
                            <p className="font-medium text-gray-800">{c.title}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{c.category} · {c.priority}</p>
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[c.status] || ''}`}>
                            {c.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div><NoticeWidget /></div>
              </div>
            )}

            {/* ✅ STUDENT VIEW */}
            {user.role === 'STUDENT' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">

                  {studentStats && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-2">
                      <StatCard label="Total"    value={studentStats.total}    color="bg-indigo-600" />
                      <StatCard label="Pending"  value={studentStats.pending}  color="bg-yellow-500" />
                      <StatCard label="Resolved" value={studentStats.resolved} color="bg-green-500" />
                      <StatCard label="Closed"   value={studentStats.closed}   color="bg-purple-500" />
                      <StatCard label="Rejected" value={studentStats.rejected} color="bg-red-500" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-700">My Recent Complaints</h2>
                    <div className="flex gap-2">
                      <Link to="/complaints/new"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        + New Complaint
                      </Link>
                      <Link to="/complaints"
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                        View All
                      </Link>
                    </div>
                  </div>

                  {myComplaints.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                      <p className="text-4xl mb-3">📋</p>
                      <p>No complaints yet</p>
                      <Link to="/complaints/new"
                        className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
                        Create your first complaint
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myComplaints.map(c => (
                        <Link key={c.id} to={`/complaints/${c.id}`}
                          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-indigo-300 transition block">
                          <div>
                            <p className="font-medium text-gray-800">{c.title}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{c.category} · {c.priority}</p>
                            {c.status === 'REJECTED' && c.rejectionReason && (
                              <p className="text-xs text-red-500 mt-1">❌ {c.rejectionReason}</p>
                            )}
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[c.status] || ''}`}>
                            {c.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div><NoticeWidget /></div>
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
