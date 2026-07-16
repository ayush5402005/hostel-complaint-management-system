import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import AppShell from '../../layouts/AppShell';
import { PageHeader, Card, CardHeader, StatCard, Icon, Spinner, SkeletonCard } from '../../components/ui';
import { STATUS_META } from '../../utils/statusMeta';

const CATEGORY_LABELS = {
  BUILDING_CIVIL: 'Building/Civil', CLEANING: 'Cleaning', ELECTRICAL: 'Electrical',
  FURNITURE: 'Furniture', GEYSER: 'Geyser', LIBRARY: 'Library', OTHER: 'Other',
  PLUMBING: 'Plumbing', ROOM_REPAIR: 'Room Repair', WATER_COOLER: 'Water Cooler', WIFI_INTERNET: 'WiFi/Internet',
};

const BarRow = ({ label, count, max, colorClass = 'bg-indigo-500' }) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="text-slate-400">{count}</span>
    </div>
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: max > 0 ? `${Math.max((count / max) * 100, count > 0 ? 3 : 0)}%` : '0%' }} />
    </div>
  </div>
);

const StarDisplay = ({ rating }) => {
  if (!rating) return <span className="text-xs text-slate-400">No ratings</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Icon key={star} name="starFilled" size={13} className={star <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'} />
      ))}
      <span className="text-xs font-semibold text-slate-600 ml-1">{rating}/5</span>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return (
      <AppShell wide>
        <PageHeader title="Analytics" subtitle="Complaint trends and performance across Hostel 10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <Spinner />
      </AppShell>
    );
  }

  const maxStatus = Math.max(1, ...Object.values(data.byStatus));
  const maxCategory = Math.max(1, ...Object.values(data.byCategory));
  const maxMonth = Math.max(1, ...data.monthlyTrend.map(m => m.count));
  const maxBlock = Math.max(1, ...data.byBlock.map(b => b.count));

  return (
    <AppShell wide>
      <PageHeader title="Analytics" subtitle="Complaint trends and performance across Hostel 10" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Complaints" value={data.totalComplaints} icon="clipboard" tone="indigo" />
        <StatCard label="Resolved" value={data.totalResolved} icon="checkCircle" tone="emerald" />
        <StatCard label="Pending" value={data.totalPending} icon="clock" tone="amber" />
        <StatCard label="Overdue" value={data.totalOverdue} icon="alertTriangle" tone="rose" />
        <StatCard label="Disputed" value={data.totalDisputed} icon="flag" tone="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title="Status Breakdown" />
          <div className="space-y-3">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <BarRow key={status} label={STATUS_META[status]?.label || status} count={count} max={maxStatus}
                colorClass={STATUS_META[status]?.solid || 'bg-slate-400'} />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Category Breakdown" />
          <div className="space-y-3">
            {Object.entries(data.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <BarRow key={category} label={CATEGORY_LABELS[category] || category} count={count} max={maxCategory} />
              ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title="Monthly Trend" subtitle="Last 6 months" />
          <div className="flex items-end gap-3 h-40 pt-2">
            {data.monthlyTrend.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                <span className="text-xs font-semibold text-slate-600">{m.count}</span>
                <div className="w-full rounded-t-lg bg-indigo-500" style={{ height: maxMonth > 0 ? `${Math.max((m.count / maxMonth) * 100, m.count > 0 ? 4 : 0)}%` : '0%' }} />
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Complaints by Block" />
          {data.byBlock.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No block data yet</p>
          ) : (
            <div className="space-y-3">
              {data.byBlock.map(b => (
                <BarRow key={b.blockName} label={`Block ${b.blockName}`} count={b.count} max={maxBlock} colorClass="bg-violet-500" />
              ))}
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Profile Completion</p>
              <p className="text-lg font-bold text-slate-800">{data.profileCompletion.completionRate}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Students</p>
              <p className="text-lg font-bold text-slate-800">{data.profileCompletion.completedProfiles}/{data.profileCompletion.totalStudents}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Top Workers" subtitle="By resolved complaints" />
        {data.topWorkers.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No resolved complaints yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Worker</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Resolved</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.topWorkers.map((w, i) => (
                  <tr key={w.workerId}>
                    <td className="py-2.5 text-slate-400">{i + 1}</td>
                    <td className="py-2.5 font-medium text-slate-700">{w.workerName}</td>
                    <td className="py-2.5 text-slate-500">{w.resolvedCount}</td>
                    <td className="py-2.5"><StarDisplay rating={w.avgRating} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
};

export default AnalyticsDashboard;
