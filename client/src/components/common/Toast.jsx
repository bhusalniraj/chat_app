import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'error', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgStyles = {
    error: 'bg-rose-500/90 text-white border-rose-400/40',
    success: 'bg-emerald-600/90 text-white border-emerald-400/40',
    info: 'bg-sky-600/90 text-white border-sky-400/40'
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />,
    info: <Info className="w-5 h-5 flex-shrink-0" />
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border animate-bounce duration-300 max-w-md">
      <div className={`flex items-center gap-3 w-full ${bgStyles[type] || bgStyles.info} px-4 py-3 rounded-xl`}>
        {icons[type]}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/20 rounded-lg transition-colors text-white/80 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
