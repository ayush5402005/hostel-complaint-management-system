import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Icon, Avatar } from '../ui';

const Topbar = memo(function Topbar({ onMenuClick }) {
  const { user }        = useAuth();
  const { unreadCount } = useNotification();

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-800 transition p-1.5 -ml-1.5">
          <Icon name="menu" size={22} />
        </button>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
          <Link to="/notifications" className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition">
            <Icon name="bell" size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link to="/profile" className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full hover:bg-slate-100 transition">
            <Avatar name={user?.name || user?.email} size="sm" />
            <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[140px] truncate">
              {user?.name || user?.email}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
});

export default Topbar;
