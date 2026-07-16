import { memo } from 'react';
import Icon from './Icon';

const TONES = {
  indigo:  'bg-indigo-50 text-indigo-600',
  slate:   'bg-slate-100 text-slate-600',
  blue:    'bg-blue-50 text-blue-600',
  amber:   'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet:  'bg-violet-50 text-violet-600',
  orange:  'bg-orange-50 text-orange-600',
  rose:    'bg-rose-50 text-rose-600',
};

// Renders whatever numeric value it's given — it does NOT reinterpret or
// remap fields. Correctness of the number itself is the caller's contract
// (see utils/statusMeta + the dashboard data-mapping tests).
const StatCard = memo(function StatCard({ label, value, icon, tone = 'indigo', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`bg-white rounded-2xl ring-1 ring-slate-200/80 p-4 flex items-center gap-3.5 text-left w-full
        ${onClick ? 'cursor-pointer hover:ring-slate-300 hover:shadow-md transition' : 'cursor-default'}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TONES[tone]}`}>
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value ?? 0}</p>
      </div>
    </button>
  );
});

export default StatCard;
