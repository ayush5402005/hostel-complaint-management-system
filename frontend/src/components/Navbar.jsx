import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout }        = useAuth();
  const { unreadCount }         = useNotification(); // ← live from context, no polling
  const navigate                = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    ADMIN:         'bg-red-100 text-red-800',
    STUDENT:       'bg-blue-100 text-blue-800',
    WORKER:        'bg-green-100 text-green-800',
    CARETAKER:     'bg-yellow-100 text-yellow-800',
    WARDEN:        'bg-purple-100 text-purple-800',
    MESS_CONVENOR: 'bg-orange-100 text-orange-800',
  };

  const navLinks = (
    <>
      <Link to="/dashboard"
        onClick={() => setMobileOpen(false)}
        className="hover:text-indigo-600 transition">
        Dashboard
      </Link>
      <Link to="/complaints"
        onClick={() => setMobileOpen(false)}
        className="hover:text-indigo-600 transition">
        Complaints
      </Link>
      {user?.role === 'STUDENT' && (
        <Link to="/complaints/new"
          onClick={() => setMobileOpen(false)}
          className="hover:text-indigo-600 transition">
          New Complaint
        </Link>
      )}
      <Link to="/notices"
        onClick={() => setMobileOpen(false)}
        className="hover:text-indigo-600 transition">
        📋 Notices
      </Link>
      {['ADMIN', 'WARDEN', 'CARETAKER'].includes(user?.role) && (
        <Link to="/admin/users"
          onClick={() => setMobileOpen(false)}
          className="hover:text-indigo-600 transition">
          👥 Users
        </Link>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">

        {/* Left */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
            🏠 HostelDesk
          </Link>
          <div className="hidden md:flex gap-4 text-sm font-medium text-gray-600">
            {navLinks}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {user && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColors[user.role] || 'bg-gray-100'}`}>
              {user.role}
            </span>
          )}

          {/* Bell — badge updates instantly via SSE */}
          <Link to="/notifications" className="relative text-gray-600 hover:text-indigo-600 text-xl">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link
            to="/profile"
            className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
          >
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </span>
            <span className="hidden lg:block">{user?.name || user?.email}</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden md:block text-sm bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-700 px-3 py-1.5 rounded-lg transition"
          >
            Logout
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden text-gray-600 hover:text-indigo-600 text-2xl leading-none"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden mt-3 pb-3 border-t border-gray-100 pt-3 flex flex-col gap-3 text-sm font-medium text-gray-600">
          {navLinks}
          <Link to="/profile"
            onClick={() => setMobileOpen(false)}
            className="hover:text-indigo-600 transition">
            👤 {user?.name || 'Profile'}
          </Link>
          <button onClick={handleLogout}
            className="text-left text-red-500 hover:text-red-600 transition">
            🚪 Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
