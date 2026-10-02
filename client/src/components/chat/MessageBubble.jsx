import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import {
  Check,
  CheckCheck,
  Reply,
  Smile,
  Trash2,
  FileText,
  Download,
  Play
} from 'lucide-react';

const COMMON_EMOJIS = ['❤️', '👍', '😂', '🔥', '😮', '😢'];

export const MessageBubble = ({ message, onReply, onImageClick }) => {
  const { user } = useAuth();
  const { reactToMessage, deleteMessage } = useChat();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isMine = message.sender?._id === user?._id;
  const reactions = message.reactions || [];

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReaction = (emoji) => {
    reactToMessage(message._id, emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div
      className={`group relative flex flex-col mb-3 ${
        isMine ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender name for group chats */}
      {!isMine && message.sender?.username && (
        <span className="text-[11px] font-semibold text-emerald-400 mb-1 ml-2">
          {message.sender.username}
        </span>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-md ${
          isMine
            ? 'bg-emerald-600 text-slate-900 rounded-tr-xs'
            : 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700/60'
        }`}
      >
        {/* Reply Quote Preview */}
        {message.replyTo && (
          <div
            className={`mb-2 pl-2.5 py-1 text-xs border-l-2 rounded-r-lg ${
              isMine
                ? 'bg-emerald-700/60 border-emerald-950 text-slate-200'
                : 'bg-slate-700/50 border-emerald-500 text-slate-300'
            }`}
          >
            <span className="font-bold text-[10px] block opacity-80">
              {message.replyTo.sender?.username || 'Replied Message'}
            </span>
            <span className="truncate block line-clamp-1">
              {message.replyTo.content || '[Attachment]'}
            </span>
          </div>
        )}

        {/* Media / Attachment Rendering */}
        {message.messageType === 'image' && message.fileUrl && (
          <div className="mb-1.5 overflow-hidden rounded-xl cursor-pointer">
            <img
              src={message.fileUrl}
              alt={message.fileName || 'Image'}
              onClick={() => onImageClick && onImageClick(message.fileUrl, message.fileName)}
              className="max-h-64 rounded-xl object-cover hover:scale-[1.02] transition-transform duration-200"
            />
          </div>
        )}

        {message.messageType === 'audio' && message.fileUrl && (
          <div className="my-1 flex items-center gap-2">
            <audio controls className="max-w-xs h-8 rounded-lg outline-none">
              <source src={message.fileUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {message.messageType === 'file' && message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noreferrer"
            download={message.fileName}
            className={`flex items-center gap-3 p-2.5 my-1 rounded-xl transition-all ${
              isMine ? 'bg-emerald-700/50 hover:bg-emerald-700 text-white' : 'bg-slate-700/60 hover:bg-slate-700 text-slate-100'
            }`}
          >
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{message.fileName || 'Document'}</p>
              {message.fileSize && (
                <span className="text-[10px] opacity-75">
                  {(message.fileSize / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
            <Download className="w-4 h-4 opacity-75" />
          </a>
        )}

        {/* Text Content */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}

        {/* Footer: Time & Read Status */}
        <div
          className={`flex items-center justify-end gap-1 text-[10px] mt-1 select-none font-medium ${
            isMine ? 'text-slate-900/75' : 'text-slate-400'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isMine && (
            <span>
              {message.isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-sky-950 font-bold inline" />
              ) : (
                <Check className="w-3.5 h-3.5 inline" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Emoji Reactions List Badge */}
      {reactions.length > 0 && (
        <div
          className={`flex flex-wrap gap-1 mt-[-6px] z-10 ${
            isMine ? 'mr-2 justify-end' : 'ml-2 justify-start'
          }`}
        >
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-full px-2 py-0.5 shadow-sm text-xs">
            {reactions.map((r, i) => (
              <span key={i} title={r.userId} className="scale-95">
                {r.emoji}
              </span>
            ))}
            <span className="text-[10px] font-bold text-slate-400 ml-0.5">
              {reactions.length}
            </span>
          </div>
        </div>
      )}

      {/* Floating Action Menu (Reply, Reaction, Delete) */}
      <div
        className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-slate-800/95 border border-slate-700/80 rounded-xl px-1 py-0.5 shadow-xl z-20 ${
          isMine ? 'right-full mr-2' : 'left-full ml-2'
        }`}
      >
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
          title="React"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onReply(message)}
          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
        {isMine && (
          <button
            onClick={() => deleteMessage(message._id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
            title="Delete message"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Reaction Popover */}
      {showEmojiPicker && (
        <div
          className={`absolute top-8 flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-30 ${
            isMine ? 'right-0' : 'left-0'
          }`}
        >
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="p-1.5 hover:scale-125 transition-transform text-base"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
