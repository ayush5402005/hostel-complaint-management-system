export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-5 animate-skeleton">
    <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
    <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
    <div className="h-3 bg-slate-100 rounded w-1/3" />
  </div>
);

export const SkeletonList = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

export const SkeletonStatRow = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-4 h-[68px] animate-skeleton">
        <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
        <div className="h-5 bg-slate-200 rounded w-1/3" />
      </div>
    ))}
  </div>
);
