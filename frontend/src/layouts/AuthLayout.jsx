import { Icon } from '../components/ui';

// Shared full-bleed layout for every unauthenticated page (login, register,
// otp, forgot/reset password) — keeps branding and card chrome consistent.
const AuthLayout = ({ icon = 'building', title, subtitle, children, wide = false }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
    <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
    />

    <div className={`relative w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
          <Icon name={icon} size={22} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1 text-center">{subtitle}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 p-7 sm:p-8">
        {children}
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">
        HostelDesk · Complaint Management System
      </p>
    </div>
  </div>
);

export const AuthAlert = ({ type = 'error', children }) => {
  const styles = type === 'error'
    ? 'bg-rose-50 border-rose-200 text-rose-700'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';
  return (
    <div className={`border text-sm px-4 py-3 rounded-xl mb-5 ${styles}`}>
      {children}
    </div>
  );
};

export default AuthLayout;
