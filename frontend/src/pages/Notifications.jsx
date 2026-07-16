import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';
import AppShell from '../layouts/AppShell';
import { PageHeader, Icon, Button, EmptyState, SkeletonList } from '../components/ui';

const TYPE_ICON = {
  COMPLAINT_CREATED:   'clipboard',
  COMPLAINT_ASSIGNED:  'hardhat',
  COMPLAINT_CLOSED:    'checkCircle',
  COMPLAINT_ESCALATED: 'alertTriangle',
  COMPLAINT_DISPUTED:  'flag',
  STATUS_UPDATED:      'refresh',
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(0);

  const { resetUnread } = useNotification();

  useEffect(() => { resetUnread(); }, [resetUnread]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications?page=${page}&size=15`);
      setNotifications(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      resetUnread();
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : null}
        action={unreadCount > 0 && <Button variant="ghost" size="sm" onClick={markAllAsRead}>Mark all as read</Button>}
      />

      {loading ? <SkeletonList count={5} /> : notifications.length === 0 ? (
        <EmptyState icon="bell" title="No notifications yet" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} onClick={() => !n.isRead && markAsRead(n.id)}
              className={`bg-white rounded-xl ring-1 px-5 py-4 flex items-start gap-4 cursor-pointer transition
                ${!n.isRead ? 'ring-indigo-200 bg-indigo-50/60 hover:bg-indigo-50' : 'ring-slate-200/80 hover:bg-slate-50'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <Icon name={TYPE_ICON[n.type] || 'bell'} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm break-words ${!n.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)} icon="chevronLeft">Previous</Button>
          <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button size="sm" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next <Icon name="chevronRight" size={14} />
          </Button>
        </div>
      )}
    </AppShell>
  );
};

export default Notifications;
