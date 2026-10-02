import React, { useState, useEffect } from 'react';
import { Users, X, Check, Search } from 'lucide-react';
import { userApi } from '../../api/chatApi.js';
import { useChat } from '../../context/ChatContext.jsx';
import { Avatar } from '../common/Avatar.jsx';

export const NewGroupModal = ({ isOpen, onClose }) => {
  const { createGroup } = useChat();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        const res = await userApi.getUsers();
        if (res.data.success) {
          setAvailableUsers(res.data.users);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    if (selectedUsers.length === 0) {
      alert('Please select at least 1 other participant');
      return;
    }

    setSubmitting(true);
    try {
      await createGroup(groupName.trim(), selectedUsers);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = availableUsers.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Create Group Chat</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 space-y-3 border-b border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 ml-1">
                Group Name
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Project Designers"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Selected Chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {selectedUsers.map((id) => {
                  const u = availableUsers.find((user) => user._id === id);
                  if (!u) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      {u.username}
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(id)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search Filter */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 translate-y-[-2px] text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people to add..."
                className="w-full bg-slate-800/50 border border-slate-700/60 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Member Selection List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {filtered.map((u) => {
              const isSelected = selectedUsers.includes(u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => toggleSelectUser(u._id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.username} size="sm" />
                    <span className="text-sm font-medium text-white">{u.username}</span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Submit */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/90">
            <button
              type="submit"
              disabled={submitting || !groupName.trim() || selectedUsers.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? 'Creating group...' : `Create Group (${selectedUsers.length} members)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
