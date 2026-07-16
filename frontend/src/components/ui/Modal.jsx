import Icon from './Icon';

const Modal = ({ open, onClose, title, subtitle, icon, children, maxWidth = 'max-w-sm' }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl w-full ${maxWidth} shadow-2xl ring-1 ring-slate-900/5 max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-3 px-6 pt-6">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Icon name={icon} size={18} />
                </div>
              )}
              <div>
                {title && <h3 className="text-base font-bold text-slate-800">{title}</h3>}
                {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 -mt-1 -mr-1">
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        )}
        <div className="p-6 pt-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
