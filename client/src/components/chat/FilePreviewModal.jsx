import React from 'react';
import { X, Download } from 'lucide-react';

export const FilePreviewModal = ({ fileUrl, fileName, onClose }) => {
  if (!fileUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl overflow-hidden"
      >
        {/* Actions Header */}
        <div className="w-full flex items-center justify-between pb-3 px-2 text-slate-300">
          <span className="text-xs font-semibold truncate max-w-xs">{fileName || 'Image Preview'}</span>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download={fileName || 'download'}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="overflow-hidden rounded-2xl max-h-[75vh] flex items-center justify-center bg-black/40">
          <img
            src={fileUrl}
            alt={fileName || 'Preview'}
            className="object-contain max-h-[75vh] max-w-full select-none"
          />
        </div>
      </div>
    </div>
  );
};
