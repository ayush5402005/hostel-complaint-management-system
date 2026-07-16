const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div className="flex items-center gap-2 flex-wrap">{action}</div>}
  </div>
);

export default PageHeader;
