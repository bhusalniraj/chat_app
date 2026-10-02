import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { ChatItem } from './ChatItem.jsx';
import { NewChatModal } from './NewChatModal.jsx';
import { NewGroupModal } from './NewGroupModal.jsx';
import { ProfileModal } from './ProfileModal.jsx';
import {
  MessageSquarePlus,
  Users,
  Search,
  Settings,
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react';

export const Sidebar = ({ onSelectChat }) => {
  const { user, logout } = useAuth();
  const { chats, activeChat, setActiveChat, loadingChats } = useChat();
  const { isConnected } = useSocket();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'direct' | 'groups'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Filter chats by tab & search query
  const filteredChats = chats.filter((chat) => {
    // Tab filter
    if (activeTab === 'direct' && chat.isGroupChat) return false;
    if (activeTab === 'groups' && !chat.isGroupChat) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (chat.isGroupChat) {
        return chat.groupName?.toLowerCase().includes(q);
      } else {
        const partner = chat.participants.find((p) => p._id !== user?._id);
        return partner?.username?.toLowerCase().includes(q);
      }
    }
    return true;
  });

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none">
      {/* Top Header / Profile Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 cursor-pointer group"
          title="Edit Profile"
        >
          <Avatar
            src={user?.avatar}
            name={user?.username}
            size="md"
            showStatus
            isOnline={isConnected}
          />
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              {user?.username}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              {isConnected ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-500">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowNewGroup(true)}
            className="p-2 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="New Group"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowProfile(true)}
            className="p-2 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="Profile Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="p-2 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-3 pb-2 gap-1.5 text-xs font-semibold text-slate-400">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-800 text-emerald-400 font-bold'
              : 'hover:bg-slate-800/50 hover:text-slate-200'
          }`}
        >
          All ({chats.length})
        </button>
        <button
          onClick={() => setActiveTab('direct')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'direct'
              ? 'bg-slate-800 text-emerald-400 font-bold'
              : 'hover:bg-slate-800/50 hover:text-slate-200'
          }`}
        >
          Direct ({chats.filter((c) => !c.isGroupChat).length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'groups'
              ? 'bg-slate-800 text-emerald-400 font-bold'
              : 'hover:bg-slate-800/50 hover:text-slate-200'
          }`}
        >
          Groups ({chats.filter((c) => c.isGroupChat).length})
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto space-y-1 py-1">
        {loadingChats ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading conversations...</span>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate-500">
            <p className="text-sm font-medium text-slate-400 mb-1">No chats found</p>
            <p className="text-xs text-slate-500 mb-4">
              Start chatting by clicking the button below.
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatItem
              key={chat._id}
              chat={chat}
              isActive={activeChat?._id === chat._id}
              onClick={() => {
                setActiveChat(chat);
                if (onSelectChat) onSelectChat();
              }}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
      <NewGroupModal isOpen={showNewGroup} onClose={() => setShowNewGroup(false)} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
};
