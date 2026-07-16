import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import AppShell from '../../layouts/AppShell';
import { mediaUrl } from '../../utils/mediaUrl';
import { PageHeader, Card, Input, Select, Button, Icon, Badge, Avatar, EmptyState, SkeletonList, Modal, Textarea } from '../../components/ui';

const BLOCKS = ['A', 'B'];

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const editableFields = [
  { key: 'hostelFeeUtr', label: 'Hostel Fee UTR' },
  { key: 'hostelFeeAmount', label: 'Hostel Fee Amount', type: 'number' },
  { key: 'messFeeUtr', label: 'Mess Fee UTR' },
  { key: 'messFeeAmount', label: 'Mess Fee Amount', type: 'number' },
  { key: 'parentContact', label: 'Parent Contact' },
];

const StudentDirectory = () => {
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const [name, setName] = useState('');
  const [block, setBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const [showVacancies, setShowVacancies] = useState(false);
  const [vacancyBlock, setVacancyBlock] = useState('A');
  const [vacancies, setVacancies] = useState([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);

  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const buildParams = useCallback((extra = {}) => {
    const params = new URLSearchParams();
    if (name.trim()) params.set('name', name.trim());
    if (block) params.set('block', block);
    if (roomNumber.trim()) params.set('roomNumber', roomNumber.trim());
    Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    return params;
  }, [name, block, roomNumber]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams({ page, size: 20 });
      const res = await api.get(`/admin/students?${params}`);
      setStudents(res.data.content);
      setPageData(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildParams, page, showToast]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchStudents();
  };

  const fetchVacancies = useCallback(async (b) => {
    setVacanciesLoading(true);
    try {
      const res = await api.get(`/admin/students/vacancies?block=${b}`);
      setVacancies(res.data);
    } catch {
      showToast('Failed to load vacancies', 'error');
    } finally {
      setVacanciesLoading(false);
    }
  }, [showToast]);

  useEffect(() => { if (showVacancies) fetchVacancies(vacancyBlock); }, [showVacancies, vacancyBlock, fetchVacancies]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const params = buildParams();
      const res = await api.get(`/admin/students/export/${type}?${params}`, { responseType: 'blob' });
      downloadBlob(res.data, `students.${type}`);
    } catch {
      showToast(`Failed to export ${type.toUpperCase()}`, 'error');
    } finally {
      setExporting('');
    }
  };

  const openEdit = (s) => {
    setEditStudent(s);
    setEditForm({
      hostelFeeUtr: s.hostelFeeUtr || '', hostelFeeAmount: s.hostelFeeAmount ?? '',
      messFeeUtr: s.messFeeUtr || '', messFeeAmount: s.messFeeAmount ?? '',
      parentContact: s.parentContact || '', homeAddress: s.homeAddress || '',
    });
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      // hostelFeeAmount/messFeeAmount are Float columns in Prisma — the
      // number <input>'s value is always a string, and Prisma rejects a
      // string where it expects a number, so it must be coerced here.
      // Left blank means "leave un-updated" (backend skips null/undefined).
      const payload = {
        ...editForm,
        hostelFeeAmount: editForm.hostelFeeAmount === '' ? undefined : Number(editForm.hostelFeeAmount),
        messFeeAmount: editForm.messFeeAmount === '' ? undefined : Number(editForm.messFeeAmount),
      };
      await api.put(`/admin/students/${editStudent.userId}/profile`, payload);
      showToast('Profile updated successfully!', 'success');
      setEditStudent(null);
      fetchStudents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <AppShell wide>
      <Modal open={!!editStudent} onClose={() => setEditStudent(null)} icon="edit"
        title={editStudent ? `Edit Profile — ${editStudent.studentName}` : ''} maxWidth="max-w-lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {editableFields.map(f => (
              <Input key={f.key} label={f.label} type={f.type || 'text'}
                value={editForm[f.key] ?? ''} onChange={e => setEditForm(v => ({ ...v, [f.key]: e.target.value }))} />
            ))}
          </div>
          <Textarea label="Home Address" rows={2} value={editForm.homeAddress ?? ''}
            onChange={e => setEditForm(v => ({ ...v, homeAddress: e.target.value }))} />
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setEditStudent(null)}>Cancel</Button>
          <Button className="flex-1" onClick={handleEditSave} loading={editLoading} icon="checkCircle">Save Changes</Button>
        </div>
      </Modal>

      <Modal open={showVacancies} onClose={() => setShowVacancies(false)} icon="building"
        title="Room Vacancies" maxWidth="max-w-md">
        <Select value={vacancyBlock} onChange={e => setVacancyBlock(e.target.value)} className="mb-4">
          {BLOCKS.map(b => <option key={b} value={b}>Block {b}</option>)}
        </Select>
        {vacanciesLoading ? <SkeletonList count={3} /> : vacancies.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No rooms with vacancies in Block {vacancyBlock}</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {vacancies.map(v => (
              <div key={v.roomNumber} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 ring-1 ring-slate-200">
                <span className="text-sm font-medium text-slate-700">Room {v.roomNumber}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">{v.occupiedSeats}/2 occupied</span>
                  <Badge tone={v.vacantSeats > 0 ? 'emerald' : 'neutral'}>{v.vacantSeats} vacant</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <PageHeader
        title="Student Directory"
        subtitle={`${pageData.totalElements ?? 0} student${pageData.totalElements === 1 ? '' : 's'} in Hostel 10`}
        action={
          <>
            <Button variant="subtle" icon="building" onClick={() => setShowVacancies(true)}>Vacancies</Button>
            <Button variant="subtle" icon="fileText" loading={exporting === 'csv'} onClick={() => handleExport('csv')}>Export CSV</Button>
            <Button variant="subtle" icon="fileText" loading={exporting === 'pdf'} onClick={() => handleExport('pdf')}>Export PDF</Button>
          </>
        }
      />

      <form onSubmit={handleSearch} className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name..." value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500" />
        </div>
        <Select value={block} onChange={e => setBlock(e.target.value)} className="w-32">
          <option value="">All Blocks</option>
          {BLOCKS.map(b => <option key={b} value={b}>Block {b}</option>)}
        </Select>
        <Input placeholder="Room no." value={roomNumber} onChange={e => setRoomNumber(e.target.value)} className="w-32" />
        <Button type="submit" icon="filter">Filter</Button>
      </form>

      {loading ? <SkeletonList count={6} /> : students.length === 0 ? (
        <EmptyState icon="users" title="No students found" />
      ) : (
        <>
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Name', 'Email', 'Block/Room', 'Scholar No', 'Parent Contact', 'Profile', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => (
                    <tr key={s.userId} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {s.profilePhotoUrl
                            ? <img src={mediaUrl(s.profilePhotoUrl)} alt="" className="w-8 h-8 rounded-full object-cover" />
                            : <Avatar name={s.studentName} size="sm" />}
                          <span className="font-medium text-slate-800 whitespace-nowrap">{s.studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{s.email}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.blockName ? `Block ${s.blockName} / ${s.roomNumber}` : '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{s.scholarNumber || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{s.parentContact || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={s.profileComplete ? 'emerald' : 'amber'}>{s.profileComplete ? 'Complete' : 'Pending'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {s.id != null ? (
                          <button onClick={() => openEdit(s)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg transition font-medium whitespace-nowrap">
                            Edit
                          </button>
                        ) : <span className="text-xs text-slate-300">Not submitted</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {pageData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <Button variant="subtle" size="sm" icon="chevronLeft" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="text-xs text-slate-500">Page {page + 1} of {pageData.totalPages}</span>
              <Button variant="subtle" size="sm" icon="chevronRight" disabled={page >= pageData.totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};

export default StudentDirectory;
