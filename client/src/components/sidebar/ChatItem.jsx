import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Image, FileText, Mic, Check, CheckCheck } from 'lucide-react';

export const ChatItem = ({ chat, isActive, onClick }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();

  const isGroup = chat.isGroupChat;
  const partner = !isGroup
    ? chat.participants.find((p) => p._id !== user?._id)
    : null;

  const chatName = isGroup ? chat.groupName : partner?.username || 'Unknown';
  const chatAvatar = isGroup ? chat.groupAvatar : partner?.avatar;
  const isOnline = !isGroup && partner ? isUserOnline(partner._id) : false;

  const lastMsg = chat.lastMessage;
  const isLastMsgMine = lastMsg?.sender?._id === user?._id;

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderLastMessageSnippet = () => {
    if (!lastMsg) return <span className="text-slate-500 italic">No messages yet</span>;

    const prefix = isLastMsgMine ? 'You: ' : isGroup && lastMsg.sender?.username ? `${lastMsg.sender.username}: ` : '';

    if (lastMsg.messageType === 'image') {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          {prefix}<Image className="w-3.5 h-3.5 text-emerald-400" /> Photo
        </span>
      );
    }
    if (lastMsg.messageType === 'audio') {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          {prefix}<Mic className="w-3.5 h-3.5 text-emerald-400" /> Voice note
        </span>
      );
    }
    if (lastMsg.messageType === 'file') {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          {prefix}<FileText className="w-3.5 h-3.5 text-emerald-400" /> {lastMsg.fileName || 'Attachment'}
        </span>
      );
    }

    return (
      <span className="line-clamp-1 text-slate-400">
        {prefix}{lastMsg.content}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 mx-2 rounded-2xl cursor-pointer transition-all duration-150 select-none ${
        isActive
          ? 'bg-slate-800 border border-slate-700/80 shadow-md'
          : 'hover:bg-slate-800/50 border border-transparent'
      }`}
    >
      <Avatar
        src={chatAvatar}
        name={chatName}
        size="md"
        isGroup={isGroup}
        showStatus={!isGroup}
        isOnline={isOnline}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4
            className={`text-sm font-semibold truncate ${
              isActive ? 'text-emerald-400' : 'text-slate-100'
            }`}
          >
            {chatName}
          </h4>
          <span className="text-[11px] text-slate-500 flex-shrink-0 font-medium ml-2">
            {formatTime(chat.lastMessageAt || chat.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 min-w-0 text-slate-400">
            {isLastMsgMine && (
              <span className="text-slate-500">
                {lastMsg?.isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                ) : (
                  <Check className="w-3.5 h-3.5 inline" />
                )}
              </span>
            )}
            {renderLastMessageSnippet()}
          </div>

          {chat.unreadCount > 0 && !isActive && (
            <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
