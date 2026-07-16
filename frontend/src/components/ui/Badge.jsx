import { memo } from 'react';
import Icon from './Icon';

// Generic pill badge. Pass `className` with a semantic tone (see utils/statusMeta)
// or one of the built-in tones below for ad-hoc use.
const TONES = {
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  indigo:  'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  blue:    'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  amber:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  violet:  'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  orange:  'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  rose:    'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const Badge = memo(function Badge({ children, tone = 'neutral', icon, className = '', pulse = false }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap
      ${TONES[tone] || tone || TONES.neutral} ${pulse ? 'animate-pulse' : ''} ${className}`}>
      {icon && <Icon name={icon} size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
});

export default Badge;
