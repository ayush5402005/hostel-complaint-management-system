import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  CREATED: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-purple-100 text-purple-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (['CARETAKER', 'WARDEN'].includes(user.role)) {
          const res = await api.get('/complaints/dashboard');
          setStats(res.data);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome back 👋</h1>
          <p className="text-gray-500 text-sm mt-1">{user.email} · {user.role}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {['CARETAKER', 'WARDEN'].includes(user.role) && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total" value={stats.total} color="bg-indigo-600" />
                  <StatCard label="Created" value={stats.created} color="bg-gray-500" />
                  <StatCard label="Assigned" value={stats.assigned} color="bg-blue-500" />
                  <StatCard label="In Progress" value={stats.inProgress} color="bg-yellow-500" />
                  <StatCard label="Resolved" value={stats.resolved} color="bg-green-500" />
                  <StatCard label="Closed" value={stats.closed} color="bg-purple-500" />
                  <StatCard label="Rejected" value={stats.rejected} color="bg-red-500" />
                </div>
                <Link to="/complaints"
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
                  View All Complaints →
                </Link>
              </div>
            )}

            {['STUDENT', 'WORKER', 'MESS_CONVENOR'].includes(user.role) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-700">
                    {user.role === 'WORKER' ? 'Assigned to Me' : 'My Recent Complaints'}
                  </h2>
                  <div className="flex gap-2">
                    {user.role === 'STUDENT' && (
                      <Link to="/complaints/new"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        + New Complaint
                      </Link>
                    )}
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
                    {user.role === 'STUDENT' && (
                      <Link to="/complaints/new"
                        className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
                        Create your first complaint
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myComplaints.map(c => (
                      <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{c.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{c.category} · {c.priority}</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[c.status] || ''}`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
