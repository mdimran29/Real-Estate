import { useState, useEffect } from 'react';

/**
 * Toast notification component for user feedback
 * Usage: 
 * const { showToast } = useToast();
 * showToast('Success message!', 'success');
 */

const Toast = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <div className="flex items-center space-x-3 bg-white rounded-lg shadow-lg p-4 min-w-[300px] max-w-md border-l-4"
         style={{ borderLeftColor: colors[type].replace('bg-', '') }}>
      <div className={`${colors[type]} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0`}>
        {icons[type]}
      </div>
      <p className="text-gray-800 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
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

  // Make showToast available globally
  useEffect(() => {
    window.showToast = (message, type = 'info', duration = 3000) => {
      const id = Date.now();
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
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
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

// Hook for using toast in components
export const useToast = () => {
  const showToast = (message, type = 'info', duration = 3000) => {
    if (window.showToast) {
      window.showToast(message, type, duration);
    }
  };

  return { showToast };
};

export default ToastContainer;
