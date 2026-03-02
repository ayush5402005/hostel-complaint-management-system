import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const NoticeBoardPage = () => {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  const [notices, setNotices]           = useState([]);
  const [title, setTitle]               = useState('');
  const [content, setContent]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [imageUrl, setImageUrl]         = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const canPost = ['ADMIN', 'WARDEN', 'CARETAKER'].includes(user?.role);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch {
      showToast('Failed to load notices', 'error');
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  // ✅ Image upload to Cloudinary (same as complaint photo)
  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      setImageUrl(data.secure_url);
      showToast('Image uploaded!', 'success');
    } catch {
      showToast('Image upload failed', 'error');
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
      await api.post('/notices', {
        title,
        content,
        imageUrl: imageUrl || null,
      });
      setTitle('');
      setContent('');
      setImageUrl('');
      showToast('Notice posted successfully!', 'success');
      fetchNotices();
    } catch {
      showToast('Failed to post notice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // ✅ prevent navigating to detail on delete click
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 Notice Board</h1>

        {/* Post Notice */}
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

            {/* ✅ Image upload */}
            <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition
              ${imageUrl
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
              <span className="text-2xl">
                {imageUrl ? '🖼️' : uploadingImage ? '⏳' : '📷'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700">
                  {imageUrl ? 'Image attached!' : uploadingImage ? 'Uploading...' : 'Attach image (optional)'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {imageUrl ? imageUrl.split('/').pop() : 'JPG, PNG up to 10MB'}
                </p>
              </div>
              {imageUrl && (
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setImageUrl(''); }}
                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                >
                  Remove
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleImageUpload(e.target.files[0])}
              />
            </label>

            {/* Image preview */}
            {imageUrl && (
              <img
                src={imageUrl}
                alt="preview"
                className="w-full max-h-48 object-cover rounded-xl border border-gray-200"
              />
            )}

            <button
              onClick={handlePost}
              disabled={loading || uploadingImage}
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
              <div
                key={n.id}
                onClick={() => navigate(`/notices/${n.id}`)}
                className="bg-white rounded-2xl border-l-4 border-indigo-500 border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-indigo-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800 text-base">📌 {n.title}</h3>
                      {/* ✅ Image badge */}
                      {n.imageUrl && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                          🖼️ Image
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Posted by <span className="font-semibold text-gray-600">{n.postedByName}</span>
                      {' '}({n.postedByRole}) ·{' '}
                      {new Date(n.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* ✅ Thumbnail */}
                    {n.imageUrl && (
                      <img
                        src={n.imageUrl}
                        alt="notice"
                        className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                        onClick={e => e.stopPropagation()}
                      />
                    )}
                    {canPost && (
                      <button
                        onClick={e => handleDelete(e, n.id)}
                        className="text-gray-300 hover:text-red-500 transition text-lg"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
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
