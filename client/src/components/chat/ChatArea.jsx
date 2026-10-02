import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { ChatHeader } from './ChatHeader.jsx';
import { MessageList } from './MessageList.jsx';
import { MessageInput } from './MessageInput.jsx';
import { EmptyChat } from './EmptyChat.jsx';
import { FilePreviewModal } from './FilePreviewModal.jsx';

export const ChatArea = ({ onBack, onStartNewChat }) => {
  const { activeChat, messages, loadingMessages } = useChat();
  const [replyingTo, setReplyingTo] = useState(null);
  const [previewFile, setPreviewFile] = useState(null); // { url, name }

  if (!activeChat) {
    return <EmptyChat onStartNewChat={onStartNewChat} />;
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-hidden relative">
      <ChatHeader onBack={onBack} />

      {loadingMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading messages...</span>
        </div>
      ) : (
        <MessageList
          messages={messages}
          onReply={(msg) => setReplyingTo(msg)}
          onImageClick={(url, name) => setPreviewFile({ url, name })}
        />
      )}

      <MessageInput
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Media Lightbox Modal */}
      {previewFile && (
        <FilePreviewModal
          fileUrl={previewFile.url}
          fileName={previewFile.name}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};
