import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const NoticeBoardPage = () => {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const [notices, setNotices]   = useState([]);
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [loading, setLoading]   = useState(false);

  const canPost = ['WARDEN', 'CARETAKER'].includes(user?.role);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch { showToast('Failed to load notices', 'error'); }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required', 'warning'); return;
    }
    setLoading(true);
    try {
      await api.post('/notices', { title, content });
      setTitle(''); setContent('');
      showToast('Notice posted successfully!', 'success');
      fetchNotices();
    } catch { showToast('Failed to post notice', 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      showToast('Notice deleted', 'success');
      fetchNotices();
    } catch { showToast('Failed to delete notice', 'error'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 Notice Board</h1>

        {/* Post Notice — warden/caretaker only */}
        {canPost && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">Post New Notice</h2>
            <input
              placeholder="Notice Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              placeholder="Notice Content..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={handlePost}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Posting...' : '📌 Post Notice'}
            </button>
          </div>
        )}

        {/* Notice List */}
        {notices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>No notices posted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map(n => (
              <div key={n.id}
                className="bg-white rounded-2xl border-l-4 border-indigo-500 border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-base">📌 {n.title}</h3>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-3">
                      Posted by <span className="font-semibold text-gray-600">{n.postedByName}</span>
                      {' '}({n.postedByRole}) ·{' '}
                      {new Date(n.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {canPost && (
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-gray-300 hover:text-red-500 transition text-lg flex-shrink-0"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>
      </div>
    </div>
  );
};

export default NoticeBoardPage;
