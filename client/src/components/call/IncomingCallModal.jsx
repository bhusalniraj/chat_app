import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext.jsx';
import { Avatar } from '../common/Avatar.jsx';

export const IncomingCallModal = () => {
  const { callState, caller, callType, answerCall, rejectCall } = useCall();

  if (callState !== 'incoming' || !caller) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
        {/* Ringing ripple effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full animate-call-ring pointer-events-none" />

        <div className="relative mb-6">
          <Avatar
            src={caller.avatar}
            name={caller.username}
            size="xl"
          />
          <div className="mt-4">
            <h3 className="text-xl font-bold text-white">{caller.username}</h3>
            <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5 mt-1">
              {callType === 'video' ? (
                <>
                  <Video className="w-3.5 h-3.5" /> Incoming Video Call...
                </>
              ) : (
                <>
                  <Phone className="w-3.5 h-3.5" /> Incoming Voice Call...
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={rejectCall}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white group"
          >
            <div className="w-14 h-14 rounded-full bg-rose-500/20 group-hover:bg-rose-600 text-rose-400 group-hover:text-white flex items-center justify-center transition-all shadow-lg shadow-rose-500/20">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold">Decline</span>
          </button>

          <button
            onClick={answerCall}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500 group-hover:bg-emerald-600 text-slate-950 flex items-center justify-center transition-all shadow-lg shadow-emerald-500/30 scale-105">
              <Phone className="w-6 h-6 fill-current" />
            </div>
            <span className="text-xs font-semibold">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};
