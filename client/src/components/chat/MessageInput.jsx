import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Image as ImageIcon,
  FileText,
  Music
} from 'lucide-react';
import { useChat } from '../../context/ChatContext.jsx';

const EMOJI_PALETTE = ['😊', '😂', '❤️', '🔥', '👍', '🎉', '🙌', '😎', '✨', '👋', '😍', '🤔', '🚀', '💯', '👏', '🤝'];

export const MessageInput = ({ replyingTo, onCancelReply }) => {
  const { sendMessage, setTyping } = useChat();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [replyingTo]);

  const handleInputChange = (e) => {
    setContent(e.target.value);

    // Emit typing event
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1500);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      setSelectedFile(file);
    }
    setShowAttachMenu(false);
  };

  const triggerFileInput = (acceptType) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!content.trim() && !selectedFile) || sending) return;

    setSending(true);
    try {
      await sendMessage({
        content: content.trim(),
        file: selectedFile,
        replyToId: replyingTo?._id
      });

      setContent('');
      setSelectedFile(null);
      if (onCancelReply) onCancelReply();
      setTyping(false);
      setShowEmojiPicker(false);
    } catch (err) {
      alert('Failed to send message: ' + (err.message || 'Error'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="p-3 bg-slate-900 border-t border-slate-800">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Reply-To Preview Bar */}
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 p-2 bg-slate-800/80 border-l-4 border-emerald-500 rounded-r-xl text-xs text-slate-300 animate-fade-in">
          <div className="min-w-0 pr-2">
            <span className="font-semibold text-emerald-400 block text-[11px]">
              Replying to {replyingTo.sender?.username || 'user'}
            </span>
            <p className="truncate line-clamp-1 text-slate-400">
              {replyingTo.content || '[Attachment]'}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected File Preview Badge */}
      {selectedFile && (
        <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 animate-fade-in">
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate font-medium">{selectedFile.name}</span>
            <span className="text-[10px] text-emerald-400/80">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="relative flex items-center gap-2">
        {/* Attachment Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Attachment Dropdown */}
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 z-30 animate-fade-in w-40">
              <button
                type="button"
                onClick={() => triggerFileInput('image/*')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 rounded-xl transition-colors text-left"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" /> Photo / Image
              </button>
              <button
                type="button"
                onClick={() => triggerFileInput('audio/*')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 rounded-xl transition-colors text-left"
              >
                <Music className="w-4 h-4 text-purple-400" /> Audio Clip
              </button>
              <button
                type="button"
                onClick={() => triggerFileInput('.pdf,.doc,.docx,.txt')}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 rounded-xl transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-blue-400" /> Document / PDF
              </button>
            </div>
          )}
        </div>

        {/* Emoji Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="Insert emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Emoji Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl grid grid-cols-8 gap-2 z-30 animate-fade-in w-72">
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="p-1 text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Area */}
        <textarea
          ref={inputRef}
          rows={1}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 max-h-32 bg-slate-800 border border-slate-700/80 rounded-2xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-all"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !selectedFile) || sending}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center"
          title="Send message"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5 stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  );
};
