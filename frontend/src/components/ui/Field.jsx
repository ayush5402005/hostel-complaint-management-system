const baseInput = 'w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';

const Label = ({ children, hint, required }) => (
  <div className="flex items-center justify-between mb-1.5">
    <label className="block text-sm font-medium text-slate-700">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
    {hint && <span className="text-xs text-slate-400">{hint}</span>}
  </div>
);

export const Input = ({ label, hint, required, error, className = '', ...rest }) => (
  <div>
    {label && <Label hint={hint} required={required}>{label}</Label>}
    <input
      className={`${baseInput} ${error ? 'border-rose-300 focus:ring-rose-500/40 focus:border-rose-500' : ''} ${className}`}
      {...rest}
    />
    {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
  </div>
);

export const Textarea = ({ label, hint, required, error, className = '', ...rest }) => (
  <div>
    {label && <Label hint={hint} required={required}>{label}</Label>}
    <textarea
      className={`${baseInput} resize-none ${error ? 'border-rose-300 focus:ring-rose-500/40 focus:border-rose-500' : ''} ${className}`}
      {...rest}
    />
    {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
  </div>
);

export const Select = ({ label, hint, required, error, className = '', children, ...rest }) => (
  <div>
    {label && <Label hint={hint} required={required}>{label}</Label>}
    <select
      className={`${baseInput} bg-white ${error ? 'border-rose-300' : ''} ${className}`}
      {...rest}
    >
      {children}
    </select>
    {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
  </div>
);

export default { Input, Textarea, Select };
