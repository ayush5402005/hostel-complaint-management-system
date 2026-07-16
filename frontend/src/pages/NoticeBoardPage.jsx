import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AppShell from '../layouts/AppShell';
import { formatDate } from '../utils/statusMeta';
import { PageHeader, Card, CardHeader, Input, Textarea, Button, Icon, Badge, EmptyState, SkeletonList } from '../components/ui';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const NoticeBoardPage = () => {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  const [notices, setNotices]               = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [title, setTitle]                   = useState('');
  const [content, setContent]               = useState('');
  const [loading, setLoading]               = useState(false);
  const [imageUrl, setImageUrl]             = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileType, setUploadedFileType] = useState('');

  const canPost = ['ADMIN', 'WARDEN', 'CARETAKER'].includes(user?.role);

  const fetchNotices = useCallback(async () => {
    setNoticesLoading(true);
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch {
      showToast('Failed to load notices', 'error');
    } finally {
      setNoticesLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const handleImageUpload = async (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Only JPG, PNG, WEBP and PDF files are allowed', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File must be less than 5MB', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const resourceType = file.type === 'application/pdf' ? 'raw' : 'image';

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      setImageUrl(data.secure_url);
      setUploadedFileName(file.name);
      setUploadedFileType(file.type);
      showToast('File uploaded!', 'success');
    } catch {
      showToast('File upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required', 'warning');
      return;
    }
    setLoading(true);
    try {
      await api.post('/notices', { title, content, imageUrl: imageUrl || null });
      setTitle(''); setContent(''); setImageUrl(''); setUploadedFileName(''); setUploadedFileType('');
      showToast('Notice posted successfully!', 'success');
      fetchNotices();
    } catch {
      showToast('Failed to post notice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      showToast('Notice deleted', 'success');
      fetchNotices();
    } catch {
      showToast('Failed to delete notice', 'error');
    }
  };

  return (
    <AppShell>
      <PageHeader title="Notice Board" subtitle="Announcements from hostel staff" />

      {canPost && (
        <Card className="mb-6 space-y-3.5">
          <CardHeader title="Post New Notice" />
          <Input placeholder="Notice Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Notice content..." value={content} onChange={e => setContent(e.target.value)} rows={4} />

          <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition
            ${imageUrl ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
            <Icon name={uploadedFileType === 'application/pdf' ? 'fileText' : imageUrl ? 'image' : uploadingImage ? 'loader' : 'paperclip'}
              size={20} className={`text-indigo-500 flex-shrink-0 ${uploadingImage ? 'animate-spin' : ''}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">
                {imageUrl ? (uploadedFileType === 'application/pdf' ? 'PDF attached!' : 'Image attached!') : uploadingImage ? 'Uploading...' : 'Attach file (optional)'}
              </p>
              <p className="text-xs text-slate-400 truncate">{imageUrl ? uploadedFileName : 'JPG, PNG, WEBP, PDF up to 5MB'}</p>
            </div>
            {imageUrl && (
              <button type="button" onClick={e => { e.preventDefault(); setImageUrl(''); setUploadedFileName(''); setUploadedFileType(''); }}
                className="text-xs text-rose-400 hover:text-rose-600 font-medium flex-shrink-0">Remove</button>
            )}
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={e => handleImageUpload(e.target.files[0])} />
          </label>

          {imageUrl && uploadedFileType !== 'application/pdf' && (
            <img src={imageUrl} alt="preview" className="w-full max-h-48 object-cover rounded-xl border border-slate-200" />
          )}
          {imageUrl && uploadedFileType === 'application/pdf' && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <Icon name="fileText" size={26} className="text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-rose-700">{uploadedFileName}</p>
                <a href={imageUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">Preview PDF ↗</a>
              </div>
            </div>
          )}

          <Button onClick={handlePost} loading={loading || uploadingImage} icon="megaphone">Post Notice</Button>
        </Card>
      )}

      {noticesLoading ? (
        <SkeletonList count={3} />
      ) : notices.length === 0 ? (
        <EmptyState icon="megaphone" title="No notices posted yet" />
      ) : (
        <div className="space-y-4">
          {notices.map(n => (
            <div key={n.id} onClick={() => navigate(`/notices/${n.id}`)}
              className="bg-white rounded-2xl border-l-4 border-indigo-500 ring-1 ring-slate-200/80 p-5 cursor-pointer hover:shadow-md hover:ring-indigo-200 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                      <Icon name="pin" size={14} className="text-indigo-400" /> {n.title}
                    </h3>
                    {n.imageUrl && (
                      <Badge tone="indigo" icon={n.imageUrl.endsWith('.pdf') ? 'fileText' : 'image'}>
                        {n.imageUrl.endsWith('.pdf') ? 'PDF' : 'Image'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{n.content}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Posted by <span className="font-semibold text-slate-600">{n.postedByName}</span> ({n.postedByRole}) · {formatDate(n.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {n.imageUrl && (
                    n.imageUrl.endsWith('.pdf') ? (
                      <div className="w-14 h-14 rounded-lg border border-rose-200 bg-rose-50 flex items-center justify-center">
                        <Icon name="fileText" size={22} className="text-rose-400" />
                      </div>
                    ) : (
                      <img src={n.imageUrl} alt="notice" className="w-14 h-14 rounded-lg object-cover border border-slate-200" onClick={e => e.stopPropagation()} />
                    )
                  )}
                  {canPost && (
                    <button onClick={e => handleDelete(e, n.id)} className="text-slate-300 hover:text-rose-500 transition p-1">
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default NoticeBoardPage;
