import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble.jsx';
import { useChat } from '../../context/ChatContext.jsx';

export const MessageList = ({ messages, onReply, onImageClick }) => {
  const { activeChat, typingUsers } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const activeTyping = activeChat ? typingUsers[activeChat._id] || [] : [];

  // Group messages by date
  const renderMessagesWithDividers = () => {
    let lastDate = null;

    return messages.map((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      const showDivider = msgDate !== lastDate;
      lastDate = msgDate;

      return (
        <React.Fragment key={msg._id || msg.createdAt}>
          {showDivider && (
            <div className="flex items-center justify-center my-4">
              <span className="bg-slate-800/80 border border-slate-700/60 text-slate-400 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm">
                {new Date(msg.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
          <MessageBubble
            message={msg}
            onReply={onReply}
            onImageClick={onImageClick}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
          <p className="text-sm font-medium">No messages in this chat yet</p>
          <p className="text-xs text-slate-500 mt-1">Send a greeting to start the conversation!</p>
        </div>
      ) : (
        renderMessagesWithDividers()
      )}

      {/* Typing Indicator */}
      {activeTyping.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 py-1 animate-pulse">
          <div className="flex gap-1 bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-full items-center">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
            <span className="text-[11px] ml-1.5 text-slate-300 font-medium">
              {activeTyping.join(', ')} is typing...
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
