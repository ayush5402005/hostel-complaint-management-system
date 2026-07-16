import { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from '../components/ui';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const STYLES = {
  success: { icon: 'checkCircle', className: 'bg-emerald-600' },
  error:   { icon: 'xCircle',     className: 'bg-rose-600' },
  warning: { icon: 'alertTriangle', className: 'bg-amber-500' },
  info:    { icon: 'info',        className: 'bg-slate-800' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-[9999] max-w-[calc(100vw-3rem)]">
        {toasts.map(toast => {
          const style = STYLES[toast.type] || STYLES.info;
          return (
            <div key={toast.id}
              className={`animate-toast-in flex items-center gap-3 px-4 py-3 rounded-xl min-w-[280px] max-w-[400px] text-white font-medium text-sm shadow-lg ${style.className}`}>
              <Icon name={style.icon} size={18} className="flex-shrink-0" />
              <span className="flex-1 break-words">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="text-white/80 hover:text-white flex-shrink-0">
                <Icon name="x" size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
