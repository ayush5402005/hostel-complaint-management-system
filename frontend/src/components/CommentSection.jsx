import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const roleColors = {
  STUDENT:   'bg-blue-100 text-blue-700',
  WORKER:    'bg-green-100 text-green-700',
  CARETAKER: 'bg-yellow-100 text-yellow-700',
  WARDEN:    'bg-purple-100 text-purple-700',
};

const CommentSection = ({ complaintId }) => {
  const { user }        = useAuth();
  const { showToast }   = useToast();
  const [comments, setComments] = useState([]);
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef();

  const fetchComments = async () => {
    try {
      const res = await api.get(`/complaints/${complaintId}/comments`);
      setComments(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 30000);
    return () => clearInterval(interval);
  }, [complaintId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await api.post(`/complaints/${complaintId}/comments`, { message });
      setMessage('');
      await fetchComments();
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase">
          💬 Discussion ({comments.length})
        </h2>
      </div>

      {/* Messages */}
      <div className="px-6 py-4 space-y-4 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">
            No messages yet. Start the conversation!
          </p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {c.userName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-gray-800">{c.userName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[c.userRole] || 'bg-gray-100 text-gray-600'}`}>
                    {c.userRole}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(c.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-2 leading-relaxed">
                  {c.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
        <input
          type="text"
          placeholder="Type a message... (Enter to send)"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={handleSend}
          disabled={loading || !message.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default CommentSection;
