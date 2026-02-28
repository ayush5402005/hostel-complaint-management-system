import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/notifications/unread-count')
        .then(res => setUnreadCount(res.data.unreadCount))
        .catch(() => {});
      const interval = setInterval(() => {
        api.get('/notifications/unread-count')
          .then(res => setUnreadCount(res.data.unreadCount))
          .catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    STUDENT: 'bg-blue-100 text-blue-800',
    WORKER: 'bg-green-100 text-green-800',
    CARETAKER: 'bg-yellow-100 text-yellow-800',
    WARDEN: 'bg-purple-100 text-purple-800',
    MESS_CONVENOR: 'bg-orange-100 text-orange-800',
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
          🏠 HostelDesk
        </Link>
        <div className="hidden md:flex gap-4 text-sm font-medium text-gray-600">
          <Link to="/dashboard" className="hover:text-indigo-600 transition">Dashboard</Link>
          <Link to="/complaints" className="hover:text-indigo-600 transition">Complaints</Link>
          {user?.role === 'STUDENT' && (
            <Link to="/complaints/new" className="hover:text-indigo-600 transition">New Complaint</Link>
          )}
          {/* ✅ NEW — Notices link for all roles */}
          <Link to="/notices" className="hover:text-indigo-600 transition">📋 Notices</Link>
          {['WARDEN', 'CARETAKER'].includes(user?.role) && (
            <Link to="/admin" className="hover:text-indigo-600 transition">Admin</Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColors[user.role] || 'bg-gray-100'}`}>
            {user.role}
          </span>
        )}
        <Link to="/notifications" className="relative text-gray-600 hover:text-indigo-600 text-xl">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        {/* ✅ NEW — Profile link showing user name */}
        <Link
          to="/profile"
          className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
        >
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </span>
          <span className="hidden lg:block">{user?.name || user?.email}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-700 px-3 py-1.5 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
