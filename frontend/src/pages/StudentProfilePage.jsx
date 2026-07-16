import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import AppShell from '../layouts/AppShell';
import { mediaUrl } from '../utils/mediaUrl';
import { Card, CardHeader, PageHeader, Input, Textarea, Button, Icon, Spinner, Badge } from '../components/ui';

const UploadField = ({ label, hint, value, onUploaded, accept = 'image/*' }) => {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/files/upload', formData);
      onUploaded(res.data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} <span className="text-rose-500">*</span></label>
      <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition
        ${value ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>
        <Icon name={value ? 'checkCircle' : uploading ? 'loader' : 'upload'} size={20}
          className={`flex-shrink-0 ${value ? 'text-emerald-600' : 'text-slate-400'} ${uploading ? 'animate-spin' : ''}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700">
            {value ? 'Uploaded — click to replace' : uploading ? 'Uploading...' : hint || 'Click to upload'}
          </p>
        </div>
        <input type="file" accept={accept} className="hidden" onChange={e => handleFile(e.target.files[0])} />
      </label>
    </div>
  );
};

const SummaryField = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">{label}</p>
    <p className="text-slate-700 font-medium mt-0.5 break-words">{value || '—'}</p>
  </div>
);

const emptyForm = {
  hostelFeeUtr: '', hostelFeeAmount: '', hostelFeeScreenshotUrl: '',
  messFeeUtr: '', messFeeAmount: '', messFeeScreenshotUrl: '',
  parentContact: '', homeAddress: '', profilePhotoUrl: '',
};

const StudentProfilePage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = await api.get('/profile/status');
      if (status.data.profileComplete) {
        const res = await api.get('/profile');
        setProfile(res.data);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const required = ['hostelFeeUtr', 'hostelFeeAmount', 'hostelFeeScreenshotUrl', 'messFeeUtr', 'messFeeAmount', 'messFeeScreenshotUrl', 'parentContact', 'homeAddress', 'profilePhotoUrl'];
    if (required.some(k => !String(form[k] || '').trim())) {
      setError('Please fill in all fields and upload both screenshots and your photo.');
      return;
    }

    setSaving(true);
    try {
      // hostelFeeAmount/messFeeAmount are Float columns in Prisma — the
      // number <input>'s e.target.value is always a string, and Prisma
      // rejects a string where it expects a number (same failure mode as
      // the complaint-category enum bug), so it must be coerced here.
      await api.post('/profile', {
        ...form,
        hostelFeeAmount: Number(form.hostelFeeAmount),
        messFeeAmount: Number(form.messFeeAmount),
      });
      showToast('Profile submitted successfully!', 'success');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppShell><Spinner full /></AppShell>;

  if (profile) {
    return (
      <AppShell>
        <PageHeader title="My Profile" subtitle="Housing & fee details on record" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5">
            <Card>
              <CardHeader title="Fee Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SummaryField label="Hostel Fee UTR" value={profile.hostelFeeUtr} />
                <SummaryField label="Hostel Fee Amount" value={profile.hostelFeeAmount != null ? `₹${profile.hostelFeeAmount}` : null} />
                <SummaryField label="Mess Fee UTR" value={profile.messFeeUtr} />
                <SummaryField label="Mess Fee Amount" value={profile.messFeeAmount != null ? `₹${profile.messFeeAmount}` : null} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Contact Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SummaryField label="Parent Contact" value={profile.parentContact} />
                <SummaryField label="Home Address" value={profile.homeAddress} />
              </div>
            </Card>
            <Card className="ring-amber-200 bg-amber-50/40">
              <p className="text-sm text-amber-700 flex items-center gap-1.5">
                <Icon name="info" size={15} />
                Need to correct a UTR or amount? Contact your warden or caretaker — they can update it for you.
              </p>
            </Card>
          </div>
          <div className="space-y-5">
            {profile.profilePhotoUrl && (
              <Card>
                <CardHeader title="Photo" />
                <img src={mediaUrl(profile.profilePhotoUrl)} alt="Profile" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
              </Card>
            )}
            <Card>
              <CardHeader title="Status" />
              <Badge tone="emerald" icon="checkCircle">Profile Complete</Badge>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Complete Your Profile" subtitle="Submit your fee receipts and contact details — required once" />
      <Card className="max-w-2xl">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg mb-5">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Hostel Fee UTR" required value={form.hostelFeeUtr} onChange={e => set('hostelFeeUtr')(e.target.value)} placeholder="e.g. UTR123456789" />
            <Input label="Hostel Fee Amount" required type="number" value={form.hostelFeeAmount} onChange={e => set('hostelFeeAmount')(e.target.value)} placeholder="e.g. 25000" />
          </div>
          <UploadField label="Hostel Fee Screenshot" value={form.hostelFeeScreenshotUrl} onUploaded={set('hostelFeeScreenshotUrl')} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Mess Fee UTR" required value={form.messFeeUtr} onChange={e => set('messFeeUtr')(e.target.value)} placeholder="e.g. UTR987654321" />
            <Input label="Mess Fee Amount" required type="number" value={form.messFeeAmount} onChange={e => set('messFeeAmount')(e.target.value)} placeholder="e.g. 18000" />
          </div>
          <UploadField label="Mess Fee Screenshot" value={form.messFeeScreenshotUrl} onUploaded={set('messFeeScreenshotUrl')} />

          <Input label="Parent Contact Number" required value={form.parentContact} onChange={e => set('parentContact')(e.target.value)} placeholder="e.g. 9876543210" />
          <Textarea label="Home Address" required rows={3} value={form.homeAddress} onChange={e => set('homeAddress')(e.target.value)} placeholder="Full home address" />
          <UploadField label="Profile Photo" value={form.profilePhotoUrl} onUploaded={set('profilePhotoUrl')} />

          <Button type="submit" loading={saving} className="w-full" size="lg">Submit Profile</Button>
        </form>
      </Card>
    </AppShell>
  );
};

export default StudentProfilePage;
