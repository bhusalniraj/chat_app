import React from 'react';

const COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-cyan-600',
];

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  showStatus = false,
  isGroup = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  const statusSizeClasses = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3.5 h-3.5 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-5 h-5 border-2'
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const getColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover border border-slate-700/50 shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses[size] || sizeClasses.md} ${getColor(name)} rounded-full flex items-center justify-center font-semibold text-white tracking-wider shadow-sm select-none`}
        >
          {isGroup ? '👥' : getInitials(name)}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size] || statusSizeClasses.md} rounded-full border-slate-900 ${
            isOnline ? 'bg-emerald-500 ring-1 ring-emerald-400/40' : 'bg-slate-500'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
