import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const NoticeDetailPage = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [notice, setNotice]   = useState(null);
  const [loading, setLoading] = useState(true);

  const canPost = ['ADMIN', 'WARDEN', 'CARETAKER'].includes(user?.role);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/notices/${id}`);
        setNotice(res.data);
      } catch {
        showToast('Failed to load notice', 'error');
        navigate('/notices');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate('/notices')}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-6 transition"
        >
          ← Back to Notice Board
        </button>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notice ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

            {/* ✅ Notice image — full width at top */}
            {notice.imageUrl && (
              <img
                src={notice.imageUrl}
                alt="notice"
                className="w-full max-h-72 object-cover"
              />
            )}

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">📌 {notice.title}</h1>
                  <p className="text-xs text-gray-400 mt-1">
                    Posted by{' '}
                    <span className="font-semibold text-gray-600">{notice.postedByName}</span>
                    {' '}·{' '}
                    <span className={`font-medium px-1.5 py-0.5 rounded text-xs
                      ${notice.postedByRole === 'ADMIN'     ? 'bg-red-100 text-red-700' :
                        notice.postedByRole === 'WARDEN'    ? 'bg-purple-100 text-purple-700' :
                        notice.postedByRole === 'CARETAKER' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'}`}>
                      {notice.postedByRole}
                    </span>
                    {' '}·{' '}
                    {new Date(notice.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {canPost && (
                  <button
                    onClick={handleDelete}
                    className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition font-medium flex-shrink-0"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>

              {/* Divider */}
              <hr className="border-gray-100 mb-4" />

              {/* Content */}
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {notice.content}
              </p>
            </div>
          </div>
        ) : null}

        <p className="text-center text-xs text-gray-400 mt-10">
          Developed by Ayush Kumar | ECE 2027 Batch
        </p>
      </div>
    </div>
  );
};

export default NoticeDetailPage;
