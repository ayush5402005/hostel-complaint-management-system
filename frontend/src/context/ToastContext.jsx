import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.container}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ ...styles.toast, ...styles[toast.type] }}>
            <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} style={styles.close}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const styles = {
  container: { position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 9999 },
  toast:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', minWidth: '280px', maxWidth: '400px', color: '#fff', fontWeight: '500', fontSize: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
  success:   { background: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  error:     { background: 'linear-gradient(135deg, #cb2d3e, #ef473a)' },
  warning:   { background: 'linear-gradient(135deg, #f7971e, #ffd200)' },
  info:      { background: 'linear-gradient(135deg, #4776e6, #8e54e9)' },
  close:     { background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', lineHeight: 1 },
};
