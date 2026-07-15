import { useState, useEffect } from 'react';

const ICONS = {
  success: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3.75m0 3.75h.007M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const STYLES = {
  success: 'bg-accent-500/15 text-accent-300 ring-accent-500/30',
  error: 'bg-red-500/15 text-red-300 ring-red-500/30',
  warning: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  info: 'bg-brand-500/15 text-brand-300 ring-brand-500/30',
};

const Toast = ({ message, type = 'info', onClose }) => {
  const [leaving, setLeaving] = useState(false);

  const close = () => {
    setLeaving(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`flex items-start gap-3 w-full sm:w-96 max-w-full bg-ink-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-card p-4 pointer-events-auto transition-all duration-200 ${
        leaving ? 'opacity-0 translate-x-4' : 'animate-slideDown'
      }`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ring-1 ring-inset flex items-center justify-center ${STYLES[type]}`}>
        {ICONS[type]}
      </div>
      <p className="flex-1 text-sm text-slate-200 leading-snug pt-1.5">{message}</p>
      <button
        onClick={close}
        className="flex-shrink-0 text-slate-500 hover:text-slate-200 transition-colors p-1 -mr-1 -mt-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.showToast = (message, type = 'info', duration = 3500) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
      }
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col items-end gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export const useToast = () => {
  const showToast = (message, type = 'info', duration = 3500) => {
    if (window.showToast) {
      window.showToast(message, type, duration);
    }
  };

  return { showToast };
};

export default ToastContainer;
