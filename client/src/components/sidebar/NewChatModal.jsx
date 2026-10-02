import React, { useState, useEffect } from 'react';
import { Search, X, MessageCirclePlus, UserPlus } from 'lucide-react';
import { userApi } from '../../api/chatApi.js';
import { useChat } from '../../context/ChatContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Avatar } from '../common/Avatar.jsx';

export const NewChatModal = ({ isOpen, onClose }) => {
  const { startDirectChat } = useChat();
  const { isUserOnline } = useSocket();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = query.trim()
          ? await userApi.searchUsers(query)
          : await userApi.getUsers();
        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [isOpen, query]);

  if (!isOpen) return null;

  const handleStartChat = async (targetUser) => {
    setStarting(targetUser._id);
    try {
      await startDirectChat(targetUser._id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <MessageCirclePlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">New Conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-800/40">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-sm gap-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Finding users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No users found matching your search.
            </div>
          ) : (
            users.map((u) => {
              const online = isUserOnline(u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => handleStartChat(u)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={u.avatar}
                      name={u.username}
                      size="md"
                      showStatus
                      isOnline={online}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {u.username}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {u.about || u.email}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={starting === u._id}
                    className="p-2 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 rounded-xl transition-all"
                  >
                    {starting === u._id ? (
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
