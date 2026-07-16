import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import AppShell from '../../layouts/AppShell';
import { PageHeader, Card, Icon, Avatar, EmptyState, SkeletonList, Badge } from '../../components/ui';

const StarDisplay = ({ rating }) => {
  if (!rating) return <span className="text-xs text-slate-400">No ratings yet</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Icon key={star} name="starFilled" size={14} className={star <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'} />
      ))}
      <span className="text-xs font-semibold text-slate-600 ml-1">{rating}/5</span>
    </div>
  );
};

const WorkerRatings = () => {
  const { showToast } = useToast();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/workers/ratings');
      setRatings([...res.data].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load worker ratings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <AppShell wide>
      <PageHeader title="Worker Ratings" subtitle="Average student rating per worker, based on closed complaints" />

      {loading ? <SkeletonList count={5} /> : ratings.length === 0 ? (
        <EmptyState icon="hardhat" title="No workers found" />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['#', 'Worker', 'Department', 'Average Rating', 'Total Ratings'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ratings.map((r, i) => (
                  <tr key={r.workerId} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.workerName} size="sm" tone="bg-emerald-100 text-emerald-700" />
                        <span className="font-medium text-slate-800 whitespace-nowrap">{r.workerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.department ? <Badge tone="neutral">{r.department}</Badge> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><StarDisplay rating={r.averageRating} /></td>
                    <td className="px-4 py-3 text-slate-500">{r.totalRatings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AppShell>
  );
};

export default WorkerRatings;
