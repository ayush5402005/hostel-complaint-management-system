import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon, Avatar } from '../ui';
import { ROLE_META } from '../../utils/statusMeta';

const STAFF_ROLES = ['ADMIN', 'WARDEN', 'CARETAKER'];

const NAV_ITEMS = [
  { to: '/dashboard',            icon: 'home',      label: 'Dashboard' },
  { to: '/complaints',           icon: 'clipboard', label: 'Complaints' },
  { to: '/notices',              icon: 'megaphone', label: 'Notice Board' },
  { to: '/my-profile',           icon: 'user',      label: 'My Profile', roles: ['STUDENT'] },
  { to: '/admin/users',          icon: 'users',     label: 'Users', roles: STAFF_ROLES },
  { to: '/admin/students',       icon: 'building',  label: 'Students', roles: STAFF_ROLES },
  { to: '/admin/worker-ratings', icon: 'star',      label: 'Worker Ratings', roles: STAFF_ROLES },
  { to: '/analytics',            icon: 'barChart',  label: 'Analytics', roles: STAFF_ROLES },
];

const NavItem = ({ to, icon, label, onNavigate, end }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
       ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`
    }
  >
    <Icon name={icon} size={18} />
    {label}
  </NavLink>
);

const Sidebar = memo(function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const roleMeta = ROLE_META[user?.role] || { label: user?.role, badge: 'bg-slate-100 text-slate-600' };
  const items = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role));

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64">
      <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <Icon name="building" size={17} className="text-white" />
        </div>
        <span className="font-bold text-[15px] tracking-tight">HostelDesk</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => (
          <NavItem key={item.to} {...item} onNavigate={onClose} end={item.to === '/dashboard'} />
        ))}
        {user?.role === 'STUDENT' && (
          <NavLink
            to="/complaints/new"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition mt-3 border border-dashed
               ${isActive ? 'border-indigo-400 text-indigo-300 bg-white/5' : 'border-white/15 text-slate-400 hover:text-white hover:border-white/30'}`
            }
          >
            <Icon name="plus" size={18} />
            New Complaint
          </NavLink>
        )}
      </nav>

      <div className="p-3 border-t border-white/5">
        <NavLink to="/profile" onClick={onClose} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition">
          <Avatar name={user?.name || user?.email} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.name || user?.email}</p>
            <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${roleMeta.badge}`}>
              {roleMeta.label}
            </span>
          </div>
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 mt-1 rounded-xl text-sm text-slate-400 hover:text-rose-300 hover:bg-white/5 transition"
        >
          <Icon name="logout" size={17} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30">{content}</aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 shadow-2xl">{content}</div>
        </div>
      )}
    </>
  );
});

export default Sidebar;
