import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  User
} from 'lucide-react';
import { useCall } from '../../context/CallContext.jsx';
import { Avatar } from '../common/Avatar.jsx';

export const CallModal = () => {
  const {
    callState,
    callType,
    peerDetails,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    endCall,
    toggleMute,
    toggleVideo
  } = useCall();

  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Timer when connected
  useEffect(() => {
    if (callState !== 'connected') {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callState]);

  if (callState !== 'calling' && callState !== 'connected') return null;

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isVideo = callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Call Info Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between p-3 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl">
          <div className="flex items-center gap-3">
            <Avatar src={peerDetails?.avatar} name={peerDetails?.username} size="sm" />
            <div>
              <h4 className="text-sm font-bold text-white">{peerDetails?.username || 'User'}</h4>
              <p className="text-[11px] text-emerald-400">
                {callState === 'calling' ? 'Calling...' : formatDuration(callDuration)}
              </p>
            </div>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
            {callType} Call
          </span>
        </div>

        {/* Video Canvas Area */}
        <div className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden">
          {isVideo && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4">
              <Avatar
                src={peerDetails?.avatar}
                name={peerDetails?.username}
                size="xl"
              />
              <p className="text-slate-400 text-sm">
                {callState === 'calling' ? 'Ringing...' : 'Connected'}
              </p>
            </div>
          )}

          {/* Local Video Thumbnail (PiP) */}
          {isVideo && (
            <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Floating Controls Bar */}
        <div className="p-4 flex items-center justify-center gap-4 bg-slate-900/90 border-t border-slate-800/80 z-20">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-full transition-all ${
              isMuted
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-lg shadow-rose-600/30 scale-105"
            title="Hang up"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Toggle Video */}
          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-full transition-all ${
                isVideoOff
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
