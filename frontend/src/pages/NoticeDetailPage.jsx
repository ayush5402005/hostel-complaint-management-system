import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AppShell from '../layouts/AppShell';
import { ROLE_META } from '../utils/statusMeta';
import { Card, Icon, Badge, Button, Spinner } from '../components/ui';

const NoticeDetailPage = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [notice, setNotice]   = useState(null);
  const [loading, setLoading] = useState(true);

  const canPost = ['ADMIN', 'WARDEN', 'CARETAKER'].includes(user?.role);

  const fetchNotice = useCallback(async () => {
    try {
      const res = await api.get(`/notices/${id}`);
      setNotice(res.data);
    } catch {
      showToast('Failed to load notice', 'error');
      navigate('/notices');
    } finally {
      setLoading(false);
    }
  }, [id, showToast, navigate]);

  useEffect(() => { fetchNotice(); }, [fetchNotice]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      showToast('Notice deleted', 'success');
      navigate('/notices');
    } catch {
      showToast('Failed to delete notice', 'error');
    }
  };

  return (
    <AppShell>
      <button onClick={() => navigate('/notices')}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-6 transition">
        <Icon name="arrowLeft" size={15} /> Back to Notice Board
      </button>

      {loading ? <Spinner full /> : notice ? (
        <Card padded={false} className="overflow-hidden max-w-2xl">
          {notice.imageUrl && (
            <img src={notice.imageUrl} alt="notice" className="w-full max-h-72 object-cover" />
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Icon name="pin" size={16} className="text-indigo-400 flex-shrink-0" /> {notice.title}
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                  Posted by <span className="font-semibold text-slate-600">{notice.postedByName}</span>
                  <Badge className={ROLE_META[notice.postedByRole]?.badge}>{ROLE_META[notice.postedByRole]?.label || notice.postedByRole}</Badge>
                  · {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {canPost && (
                <Button variant="danger" size="sm" icon="trash" onClick={handleDelete} className="flex-shrink-0">Delete</Button>
              )}
            </div>

            <hr className="border-slate-100 mb-4" />

            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">{notice.content}</p>
          </div>
        </Card>
      ) : null}
    </AppShell>
  );
};

export default NoticeDetailPage;
