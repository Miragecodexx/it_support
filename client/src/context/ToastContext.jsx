import { createContext, useContext, useState, useCallback } from 'react';
import './toasts.css';
import { useEffect } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

let idCounter = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter(x => x.id !== id));
  }, []);

  const show = useCallback((type, message, options = {}) => {
    const id = idCounter++;
    const toast = { id, type, message, timeout: options.timeout || 5000 };
    setToasts((t) => [toast, ...t]);
    if (toast.timeout > 0) setTimeout(() => remove(id), toast.timeout);
    return id;
  }, [remove]);

  const api = {
    success: (msg, opts) => show('success', msg, opts),
    error: (msg, opts) => show('error', msg, opts),
    info: (msg, opts) => show('info', msg, opts),
    warn: (msg, opts) => show('warn', msg, opts),
    remove
  };

  // Global event listener so other modules can trigger a toast without importing hook
  useEffect(() => {
    const handler = (e) => {
      const d = e.detail || {};
      if (!d.type || !d.message) return;
      show(d.type, d.message, { timeout: d.timeout });
    };
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-root">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <div className="toast-message">{t.message}</div>
            <button className="toast-close" onClick={() => remove(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
