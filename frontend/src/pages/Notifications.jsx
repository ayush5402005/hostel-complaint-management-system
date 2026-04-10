import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const typeIcons = {
  COMPLAINT_CREATED:  '📝',
  COMPLAINT_ASSIGNED: '👷',
  COMPLAINT_CLOSED:   '✅',
  COMPLAINT_ESCALATED:'⚠️',
  STATUS_UPDATED:     '🔄',
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(0);

  const { resetUnread } = useNotification(); // ← clears bell badge

  // reset badge the moment this page opens
  useEffect(() => {
    resetUnread();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/notifications?page=${page}&size=15`);
        setNotifications(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      resetUnread(); // ← also clear badge when marking all read
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-indigo-600 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              className="text-sm text-indigo-600 hover:underline font-medium">
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">🔔</p>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} onClick={() => !n.isRead && markAsRead(n.id)}
                className={`bg-white rounded-xl border px-5 py-4 flex items-start gap-4 cursor-pointer transition
                  ${!n.isRead
                    ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                    : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <span className="text-2xl">
                  {typeIcons[n.type] || '🔔'}
                </span>
                <div className="flex-1">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40">
              ← Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40">
              Next →
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>
      </div>
    </div>
  );
};

export default Notifications;
