import { memo } from 'react';

const Card = memo(function Card({ children, className = '', padded = true, onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-sm
        ${padded ? 'p-5' : ''}
        ${hover ? 'transition hover:shadow-md hover:ring-slate-300 cursor-pointer' : ''}
        ${onClick && !hover ? 'cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
});

export const CardHeader = ({ title, subtitle, action, icon }) => (
  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export default Card;
