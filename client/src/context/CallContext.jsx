import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext.jsx';
import { useAuth } from './AuthContext.jsx';

const CallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [callType, setCallType] = useState('video'); // 'video' | 'audio'
  const [caller, setCaller] = useState(null); // incoming caller details
  const [peerDetails, setPeerDetails] = useState(null); // active peer details
  const [incomingSignal, setIncomingSignal] = useState(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  // Cleanup helper
  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    iceCandidatesQueue.current = [];
    setCallState('idle');
    setCaller(null);
    setPeerDetails(null);
    setIncomingSignal(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  // Create WebRTC Peer Connection
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          to: targetUserId,
          candidate: event.candidate
        });
      }
    };

    // Receive remote tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    // Attach local stream tracks to connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  };

  // Socket WebRTC Signal Listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming Call
    const handleIncomingCall = ({ signal, from, callType: incomingType }) => {
      console.log('[WebRTC] Incoming call from:', from.username);
      setCaller(from);
      setIncomingSignal(signal);
      setCallType(incomingType || 'video');
      setCallState('incoming');
    };

    // Call Accepted by recipient
    const handleCallAccepted = async ({ signal }) => {
      console.log('[WebRTC] Call accepted by recipient');
      setCallState('connected');
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          // Process queued ICE candidates
          while (iceCandidatesQueue.current.length > 0) {
            const cand = iceCandidatesQueue.current.shift();
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
          }
        } catch (err) {
          console.error('[WebRTC] Error setting remote description:', err);
        }
      }
    };

    // Call Rejected by recipient
    const handleCallRejected = () => {
      console.log('[WebRTC] Call was rejected');
      alert('Call was declined');
      cleanupCall();
    };

    // Call Ended by either party
    const handleCallEnded = () => {
      console.log('[WebRTC] Call ended by remote peer');
      cleanupCall();
    };

    // Remote ICE candidate received
    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      } else {
        iceCandidatesQueue.current.push(candidate);
      }
    };

    const handleCallFailed = ({ message }) => {
      alert(message || 'Call failed');
      cleanupCall();
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-failed', handleCallFailed);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-failed', handleCallFailed);
    };
  }, [socket]);

  // Initiate a call
  const startCall = async (targetUser, type = 'video') => {
    try {
      setCallType(type);
      setPeerDetails(targetUser);
      setCallState('calling');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(targetUser._id);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call-user', {
        userToCall: targetUser._id,
        signalData: offer,
        callType: type
      });
    } catch (err) {
      console.error('[WebRTC] Failed to start call:', err);
      alert('Could not access microphone or camera. Please grant browser permissions.');
      cleanupCall();
    }
  };

  // Answer incoming call
  const answerCall = async () => {
    try {
      setCallState('connected');
      setPeerDetails(caller);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(caller._id);
      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));

      // Process queued candidates
      while (iceCandidatesQueue.current.length > 0) {
        const cand = iceCandidatesQueue.current.shift();
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer-call', {
        to: caller._id,
        signal: answer
      });
    } catch (err) {
      console.error('[WebRTC] Failed to answer call:', err);
      alert('Could not access microphone or camera to answer call.');
      cleanupCall();
    }
  };

  // Reject call
  const rejectCall = () => {
    if (caller && socket) {
      socket.emit('reject-call', { to: caller._id });
    }
    cleanupCall();
  };

  // End active call
  const endCall = () => {
    const targetId = peerDetails?._id || caller?._id;
    if (targetId && socket) {
      socket.emit('end-call', { to: targetId });
    }
    cleanupCall();
  };

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        caller,
        peerDetails,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
