import React from 'react';
import { Phone, Video, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useCall } from '../../context/CallContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { Avatar } from '../common/Avatar.jsx';

export const ChatHeader = ({ onBack }) => {
  const { user } = useAuth();
  const { activeChat, typingUsers } = useChat();
  const { isUserOnline } = useSocket();
  const { startCall } = useCall();

  if (!activeChat) return null;

  const isGroup = activeChat.isGroupChat;
  const partner = !isGroup
    ? activeChat.participants.find((p) => p._id !== user?._id)
    : null;

  const chatName = isGroup ? activeChat.groupName : partner?.username || 'Unknown';
  const chatAvatar = isGroup ? activeChat.groupAvatar : partner?.avatar;
  const isOnline = !isGroup && partner ? isUserOnline(partner._id) : false;

  const activeTyping = typingUsers[activeChat._id] || [];

  const handleAudioCall = () => {
    if (!partner) {
      alert('Group calls are currently supported for direct 1-on-1 chats');
      return;
    }
    startCall(partner, 'audio');
  };

  const handleVideoCall = () => {
    if (!partner) {
      alert('Group calls are currently supported for direct 1-on-1 chats');
      return;
    }
    startCall(partner, 'video');
  };

  return (
    <div className="h-16 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        {/* Back button for mobile */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <Avatar
          src={chatAvatar}
          name={chatName}
          size="md"
          isGroup={isGroup}
          showStatus={!isGroup}
          isOnline={isOnline}
        />

        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            {chatName}
          </h3>
          <p className="text-[11px]">
            {activeTyping.length > 0 ? (
              <span className="text-emerald-400 font-semibold animate-pulse">typing...</span>
            ) : isGroup ? (
              <span className="text-slate-400">
                {activeChat.participants?.length || 0} participants
              </span>
            ) : isOnline ? (
              <span className="text-emerald-400 font-medium">Online</span>
            ) : (
              <span className="text-slate-500">Offline</span>
            )}
          </p>
        </div>
      </div>

      {/* Call Buttons for Direct Chat */}
      {!isGroup && partner && (
        <div className="flex items-center gap-1.5 text-slate-300">
          <button
            onClick={handleAudioCall}
            className="p-2 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="Start Audio Call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={handleVideoCall}
            className="p-2 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="Start Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
