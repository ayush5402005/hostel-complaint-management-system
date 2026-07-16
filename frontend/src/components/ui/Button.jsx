import { memo } from 'react';
import Icon from './Icon';

const VARIANTS = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 focus-visible:ring-indigo-500',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:ring-indigo-500',
  subtle:    'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-indigo-500',
  danger:    'bg-white text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 focus-visible:ring-rose-500',
  dangerFill:'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20 focus-visible:ring-rose-500',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 focus-visible:ring-emerald-500',
  warning:   'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-600/20 focus-visible:ring-amber-500',
  accent:    'bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-600/20 focus-visible:ring-violet-500',
  ghost:     'text-slate-600 hover:bg-slate-100 focus-visible:ring-indigo-500',
};

const SIZES = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-lg',
  md: 'text-sm px-3.5 py-2 gap-2 rounded-lg',
  lg: 'text-sm px-5 py-2.5 gap-2 rounded-xl',
};

const Button = memo(function Button({
  children, variant = 'primary', size = 'md', icon, loading = false,
  disabled = false, className = '', type = 'button', ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading
        ? <Icon name="loader" size={size === 'sm' ? 14 : 16} className="animate-spin" />
        : icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
});

export default Button;
