import React from 'react';
import { MessageSquare, Shield, Zap, Sparkles } from 'lucide-react';

export const EmptyChat = ({ onStartNewChat }) => {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-slate-950 text-center select-none">
      <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-400 mb-6 shadow-2xl shadow-emerald-500/10 animate-pulse">
        <MessageSquare className="w-10 h-10" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
        ChatApp Messenger
      </h2>
      <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
        Select a conversation from the sidebar or start a new chat to connect with friends, share media, and make voice or video calls.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mb-8 text-left text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <Zap className="w-4 h-4 text-emerald-400 mb-1.5" />
          <h4 className="font-semibold text-white mb-0.5">Real-Time</h4>
          <p className="text-slate-400">Instant messaging with live typing and delivery status.</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <Shield className="w-4 h-4 text-sky-400 mb-1.5" />
          <h4 className="font-semibold text-white mb-0.5">Secured</h4>
          <p className="text-slate-400">Email OTP verification and encrypted user tokens.</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <Sparkles className="w-4 h-4 text-purple-400 mb-1.5" />
          <h4 className="font-semibold text-white mb-0.5">HD Calling</h4>
          <p className="text-slate-400">Peer-to-peer audio and video calls powered by WebRTC.</p>
        </div>
      </div>

      {onStartNewChat && (
        <button
          onClick={onStartNewChat}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
        >
          Start a New Conversation
        </button>
      )}
    </div>
  );
};
