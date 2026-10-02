import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { AuthModal } from './components/auth/AuthModal.jsx';
import { Sidebar } from './components/sidebar/Sidebar.jsx';
import { ChatArea } from './components/chat/ChatArea.jsx';
import { IncomingCallModal } from './components/call/IncomingCallModal.jsx';
import { CallModal } from './components/call/CallModal.jsx';
import { useChat } from './context/ChatContext.jsx';

export const App = () => {
  const { user, loading } = useAuth();
  const { activeChat, setActiveChat } = useChat();
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Connecting to ChatApp...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar (Full screen on mobile when no chat is selected, fixed width on desktop) */}
      <div
        className={`${
          activeChat && !showMobileSidebar ? 'hidden' : 'flex'
        } md:flex w-full md:w-80 lg:w-96 h-full flex-shrink-0 z-20`}
      >
        <Sidebar
          onSelectChat={() => setShowMobileSidebar(false)}
        />
      </div>

      {/* Chat Area */}
      <div
        className={`${
          !activeChat && showMobileSidebar ? 'hidden' : 'flex'
        } md:flex flex-1 h-full flex-col overflow-hidden z-10`}
      >
        <ChatArea
          onBack={() => setShowMobileSidebar(true)}
          onStartNewChat={() => setShowMobileSidebar(true)}
        />
      </div>

      {/* WebRTC Calling Modals */}
      <IncomingCallModal />
      <CallModal />
    </div>
  );
};

export default App;
