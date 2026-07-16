import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Icon, Avatar, Badge, CardHeader } from './ui';
import { ROLE_META } from '../utils/statusMeta';

const CommentSection = ({ complaintId, complaintStatus }) => {
  const { showToast } = useToast();

  const [comments, setComments] = useState([]);
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef();

  const isClosed = ['CLOSED', 'REJECTED'].includes(complaintStatus);

  const fetchComments = useCallback(async () => {
    try {
      const res = await api.get(`/complaints/${complaintId}/comments`);
      setComments(res.data);
    } catch { /* silent — periodic poll, next tick will retry */ }
  }, [complaintId]);

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 30000);
    return () => clearInterval(interval);
  }, [fetchComments]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    if (!message.trim() || isClosed) return;
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
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <CardHeader title={`Discussion (${comments.length})`} icon={<Icon name="send" size={14} className="text-slate-400" />} />
      </div>

      <div className="px-6 py-4 space-y-4 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-6">No messages yet. Start the conversation!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3 items-start">
              <Avatar name={c.userName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-slate-800">{c.userName}</span>
                  <Badge className={ROLE_META[c.userRole]?.badge}>{ROLE_META[c.userRole]?.label || c.userRole}</Badge>
                  <span className="text-xs text-slate-400 ml-auto">
                    {new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-2 leading-relaxed break-words">{c.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {isClosed ? (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
          <Icon name={complaintStatus === 'CLOSED' ? 'lock' : 'xCircle'} size={16} className="text-slate-400" />
          <p className="text-sm text-slate-400 font-medium">
            {complaintStatus === 'CLOSED'
              ? 'This complaint is closed. Discussion is locked.'
              : 'This complaint is rejected. Discussion is locked.'}
          </p>
        </div>
      ) : (
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <input
            type="text"
            placeholder="Type a message... (Enter to send)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            <Icon name="send" size={14} /> Send
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
