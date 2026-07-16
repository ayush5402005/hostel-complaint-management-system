import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AppShell from '../layouts/AppShell';
import { PageHeader, Card, Input, Select, Textarea, Button, Icon } from '../components/ui';

// Must match the backend's ComplaintCategory enum exactly (see
// backend/prisma/schema.prisma) — this list previously drifted from it
// (had ELECTRICITY/MESS/WATER_SUPPLY instead of ELECTRICAL/WATER_COOLER,
// and was missing BUILDING_CIVIL/LIBRARY/WIFI_INTERNET), which made every
// complaint submission fail with a 500 from Prisma rejecting the invalid
// enum value.
const CATEGORIES = ['BUILDING_CIVIL', 'CLEANING', 'ELECTRICAL', 'FURNITURE',
  'GEYSER', 'LIBRARY', 'OTHER', 'PLUMBING', 'ROOM_REPAIR', 'WATER_COOLER', 'WIFI_INTERNET'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_WINDOWS = ['Morning (9 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 7 PM)'];

const ComplaintForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', category: 'ELECTRICAL', priority: 'LOW', description: '',
    slot1Day: '', slot1Time: '', slot2Day: '', slot2Time: '', slot3Day: '', slot3Time: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WEBP and PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(file.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(file));
    setError('');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await api.post('/files/upload', formData);
        imageUrl = uploadRes.data.url;
        setUploadingImage(false);
      }

      // Unselected slots are stored as null, not empty string — Slot fields
      // are all optional on the backend.
      const slots = {};
      for (const key of ['slot1Day', 'slot1Time', 'slot2Day', 'slot2Time', 'slot3Day', 'slot3Time']) {
        slots[key] = form[key] || null;
      }

      // Backend expects `mediaUrls` as an array (see complaint.service.js
      // createComplaint) — sending the uploaded file's URL under any other
      // key silently drops the attachment.
      await api.post('/complaints', { ...form, ...slots, mediaUrls: imageUrl ? [imageUrl] : [] });
      navigate('/complaints');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Submit New Complaint" subtitle="Describe your issue clearly and our staff will get on it" />

      <Card className="max-w-2xl">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Title" required minLength={5} maxLength={200}
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Water leakage in bathroom"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Category" required value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </Select>
            <Select label="Priority" required value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>

          <div>
            <Textarea
              label="Description" required minLength={10} maxLength={1000} rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the issue in detail..."
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.description.length}/1000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Preferred Visit Slots <span className="text-slate-400 font-normal">(optional — let staff know when you're available)</span>
            </label>
            <div className="space-y-2">
              {[1, 2, 3].map(n => (
                <div key={n} className="grid grid-cols-2 gap-3">
                  <Select
                    value={form[`slot${n}Day`]}
                    onChange={e => setForm({ ...form, [`slot${n}Day`]: e.target.value })}
                  >
                    <option value="">Slot {n} — Day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                  <Select
                    value={form[`slot${n}Time`]}
                    onChange={e => setForm({ ...form, [`slot${n}Time`]: e.target.value })}
                  >
                    <option value="">Slot {n} — Time</option>
                    {TIME_WINDOWS.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Attachment <span className="text-slate-400 font-normal">(optional, max 5MB)</span>
            </label>

            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition">
                <Icon name="upload" size={24} className="text-slate-400 mb-1.5" />
                <p className="text-sm text-slate-500">Click to upload file</p>
                <p className="text-xs text-slate-400">JPG, PNG, WEBP, PDF up to 5MB</p>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={handleImageChange} />
              </label>
            ) : (
              <div className="relative">
                {imagePreview === 'pdf' ? (
                  <div className="w-full h-24 flex items-center justify-center bg-rose-50 border border-rose-200 rounded-xl gap-3">
                    <Icon name="fileText" size={28} className="text-rose-500" />
                    <div>
                      <p className="text-sm font-semibold text-rose-700">PDF attached</p>
                      <p className="text-xs text-rose-400">{imageFile?.name}</p>
                    </div>
                  </div>
                ) : (
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                )}
                <button type="button" onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-7 h-7 flex items-center justify-center">
                  <Icon name="x" size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading || uploadingImage} className="flex-1" size="lg">
              {uploadingImage ? 'Uploading...' : 'Submit Complaint'}
            </Button>
            <Button type="button" variant="subtle" size="lg" onClick={() => navigate('/complaints')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
};

export default ComplaintForm;
