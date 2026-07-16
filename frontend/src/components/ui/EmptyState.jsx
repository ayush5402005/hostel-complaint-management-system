import Icon from './Icon';

const EmptyState = ({ icon = 'clipboard', title, description, action }) => (
  <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-10 sm:p-14 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center text-slate-400 mb-4">
      <Icon name={icon} size={26} strokeWidth={1.6} />
    </div>
    <p className="text-slate-700 font-semibold">{title}</p>
    {description && <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
