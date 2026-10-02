import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { chatApi, messageApi } from '../api/chatApi.js';
import { useSocket } from './SocketContext.jsx';
import { useAuth } from './AuthContext.jsx';

const ChatContext = createContext(null);

const DEMO_CHATS = [
  {
    _id: 'chat_demo_1',
    isGroupChat: false,
    participants: [
      { _id: 'demo_user_1', username: 'Alex Rivera', email: 'alex@example.com' },
      { _id: 'demo_user_2', username: 'Sarah Connor', email: 'sarah@example.com', avatar: '', status: 'online', about: 'Working on frontend design' }
    ],
    lastMessage: {
      _id: 'm_demo_1',
      sender: { _id: 'demo_user_2', username: 'Sarah Connor' },
      content: 'Let\'s test the real-time chat and video calling!',
      createdAt: new Date().toISOString()
    },
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0
  },
  {
    _id: 'chat_demo_2',
    isGroupChat: true,
    groupName: 'Product Design Squad',
    participants: [
      { _id: 'demo_user_1', username: 'Alex Rivera' },
      { _id: 'demo_user_3', username: 'Elena Vance' },
      { _id: 'demo_user_4', username: 'David Kim' }
    ],
    lastMessage: {
      _id: 'm_demo_2',
      sender: { _id: 'demo_user_3', username: 'Elena Vance' },
      content: 'New Tailwind component kit is ready for review.',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 2
  },
  {
    _id: 'chat_demo_3',
    isGroupChat: false,
    participants: [
      { _id: 'demo_user_1', username: 'Alex Rivera' },
      { _id: 'demo_user_5', username: 'Michael Chen', email: 'michael@example.com', avatar: '', status: 'offline' }
    ],
    lastMessage: {
      _id: 'm_demo_3',
      sender: { _id: 'demo_user_5', username: 'Michael Chen' },
      content: 'Catch you later at the standup meeting.',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0
  }
];

const DEMO_MESSAGES = {
  chat_demo_1: [
    {
      _id: 'dm_1',
      sender: { _id: 'demo_user_2', username: 'Sarah Connor' },
      content: 'Hey Alex! How is the new chat app frontend coming along?',
      createdAt: new Date(Date.now() - 100000).toISOString(),
      isRead: true,
      reactions: [{ emoji: '👍', userId: 'demo_user_1' }]
    },
    {
      _id: 'dm_2',
      sender: { _id: 'demo_user_1', username: 'Alex Rivera' },
      content: 'It has dark mode, Lucide icons, voice/video calls, and file previews!',
      createdAt: new Date(Date.now() - 60000).toISOString(),
      isRead: true,
      reactions: [{ emoji: '🔥', userId: 'demo_user_2' }]
    },
    {
      _id: 'dm_3',
      sender: { _id: 'demo_user_2', username: 'Sarah Connor' },
      content: 'Awesome! Try sending an attachment or start a video call from the top right.',
      createdAt: new Date(Date.now() - 20000).toISOString(),
      isRead: true
    }
  ],
  chat_demo_2: [
    {
      _id: 'dm_21',
      sender: { _id: 'demo_user_4', username: 'David Kim' },
      content: 'Morning squad! Did everyone see the design tokens update?',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      isRead: true
    },
    {
      _id: 'dm_22',
      sender: { _id: 'demo_user_3', username: 'Elena Vance' },
      content: 'New Tailwind component kit is ready for review.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isRead: true
    }
  ],
  chat_demo_3: [
    {
      _id: 'dm_31',
      sender: { _id: 'demo_user_5', username: 'Michael Chen' },
      content: 'Catch you later at the standup meeting.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isRead: true
    }
  ]
};

export const ChatProvider = ({ children }) => {
  const { user, isDemo } = useAuth();
  const { socket } = useSocket();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  // Load chats
  const fetchChats = useCallback(async () => {
    if (!user) return;
    if (isDemo) {
      setChats(DEMO_CHATS);
      if (!activeChat) setActiveChat(DEMO_CHATS[0]);
      return;
    }

    setLoadingChats(true);
    try {
      const res = await chatApi.getChats();
      if (res.data.success) {
        setChats(res.data.chats);
      }
    } catch (err) {
      console.warn('Could not connect to backend, falling back to demo mode:', err);
      setChats(DEMO_CHATS);
      if (!activeChat) setActiveChat(DEMO_CHATS[0]);
    } finally {
      setLoadingChats(false);
    }
  }, [user, isDemo, activeChat]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Load messages
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    if (isDemo || activeChat._id.startsWith('chat_demo_')) {
      setMessages(DEMO_MESSAGES[activeChat._id] || []);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await messageApi.getMessages(activeChat._id);
        if (res.data.success) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.warn('Loading fallback demo messages:', err);
        setMessages(DEMO_MESSAGES[activeChat._id] || []);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();

    if (socket) {
      socket.emit('join-chat', activeChat._id);
    }

    return () => {
      if (socket && activeChat) {
        socket.emit('leave-chat', activeChat._id);
      }
    };
  }, [activeChat?._id, socket, isDemo]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (activeChat && newMessage.chatId?.toString() === activeChat._id?.toString()) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });

        if (newMessage.sender?._id !== user?._id) {
          socket.emit('mark-read', {
            messageId: newMessage._id,
            chatId: activeChat._id
          });
        }
      }

      setChats((prevChats) => {
        let chatFound = false;
        const updated = prevChats.map((c) => {
          if (c._id.toString() === newMessage.chatId?.toString()) {
            chatFound = true;
            return {
              ...c,
              lastMessage: newMessage,
              lastMessageAt: newMessage.createdAt,
              unreadCount:
                activeChat?._id?.toString() === c._id.toString() || newMessage.sender?._id === user?._id
                  ? 0
                  : (c.unreadCount || 0) + 1
            };
          }
          return c;
        });

        if (!chatFound) {
          fetchChats();
          return prevChats;
        }

        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };

    const handleMessageSent = (sentMessage) => {
      if (activeChat && sentMessage.chatId?.toString() === activeChat._id?.toString()) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === sentMessage._id)) return prev;
          return [...prev, sentMessage];
        });
      }
    };

    const handleUserTyping = ({ chatId, username }) => {
      if (!chatId) return;
      setTypingUsers((prev) => {
        const currentList = prev[chatId] || [];
        if (!currentList.includes(username)) {
          return { ...prev, [chatId]: [...currentList, username] };
        }
        return prev;
      });
    };

    const handleUserStopTyping = ({ chatId, userId }) => {
      if (!chatId) return;
      setTypingUsers((prev) => {
        const currentList = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: currentList.filter((u) => u !== userId)
        };
      });
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    const handleMessageRead = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, isRead: true } : msg))
      );
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);
    socket.on('message-reaction', handleReaction);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('message-read', handleMessageRead);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
      socket.off('message-reaction', handleReaction);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('message-read', handleMessageRead);
    };
  }, [socket, activeChat, user?._id, fetchChats]);

  // Send message
  const sendMessage = async ({ content, file, replyToId }) => {
    if (!activeChat) return;

    if (isDemo || activeChat._id.startsWith('chat_demo_')) {
      const newMsg = {
        _id: 'dm_' + Date.now(),
        sender: user,
        content: content || (file ? file.name : ''),
        messageType: file ? (file.type.startsWith('image/') ? 'image' : 'file') : 'text',
        fileUrl: file ? URL.createObjectURL(file) : null,
        fileName: file ? file.name : null,
        fileSize: file ? file.size : null,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      setMessages((prev) => [...prev, newMsg]);

      // Simulate partner reply
      const partner = activeChat.participants.find((p) => p._id !== user._id);
      if (partner) {
        setTypingUsers((prev) => ({ ...prev, [activeChat._id]: [partner.username] }));
        setTimeout(() => {
          setTypingUsers((prev) => ({ ...prev, [activeChat._id]: [] }));
          const simulatedReply = {
            _id: 'dm_reply_' + Date.now(),
            sender: partner,
            content: "Received! That looks super clean and responsive!",
            messageType: 'text',
            createdAt: new Date().toISOString(),
            isRead: true
          };
          setMessages((prev) => [...prev, simulatedReply]);
        }, 1400);
      }
      return newMsg;
    }

    if (file) {
      const formData = new FormData();
      formData.append('chatId', activeChat._id);
      if (content) formData.append('content', content);
      if (replyToId) formData.append('replyTo', replyToId);
      formData.append('file', file);

      try {
        const res = await messageApi.sendMessage(formData);
        if (res.data.success) {
          return res.data.message;
        }
      } catch (err) {
        console.error('Failed to send file message:', err);
        throw err;
      }
    } else if (content && content.trim()) {
      if (socket) {
        const partner = !activeChat.isGroupChat
          ? activeChat.participants.find((p) => p._id !== user._id)
          : null;

        socket.emit('send-message', {
          chatId: activeChat._id,
          receiverId: partner?._id,
          content: content.trim(),
          replyTo: replyToId
        });
      }
    }
  };

  const setTyping = (isTyping) => {
    if (!socket || !activeChat) return;
    const partner = !activeChat.isGroupChat
      ? activeChat.participants.find((p) => p._id !== user._id)
      : null;

    if (isTyping) {
      socket.emit('typing', { chatId: activeChat._id, receiverId: partner?._id });
    } else {
      socket.emit('stop-typing', { chatId: activeChat._id, receiverId: partner?._id });
    }
  };

  const reactToMessage = async (messageId, emoji) => {
    if (isDemo || activeChat?._id.startsWith('chat_demo_')) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, reactions: [...(msg.reactions || []), { emoji, userId: user._id }] }
            : msg
        )
      );
      return;
    }

    if (socket) {
      socket.emit('reaction', {
        messageId,
        emoji,
        chatId: activeChat?._id
      });
    } else {
      await messageApi.addReaction(messageId, emoji);
    }
  };

  const deleteMessage = async (messageId) => {
    if (isDemo || activeChat?._id.startsWith('chat_demo_')) {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      return;
    }

    try {
      await messageApi.deleteMessage(messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const startDirectChat = async (targetUserId) => {
    try {
      const res = await chatApi.getOrCreateChat(targetUserId);
      if (res.data.success) {
        const chat = res.data.chat;
        setChats((prev) => {
          if (prev.some((c) => c._id === chat._id)) return prev;
          return [chat, ...prev];
        });
        setActiveChat(chat);
        return chat;
      }
    } catch (err) {
      console.error('Failed to start direct chat:', err);
      throw err;
    }
  };

  const createGroup = async (groupName, participants) => {
    try {
      const res = await chatApi.createGroupChat({ groupName, participants });
      if (res.data.success) {
        const chat = res.data.chat;
        setChats((prev) => [chat, ...prev]);
        setActiveChat(chat);
        if (socket) socket.emit('join-chat', chat._id);
        return chat;
      }
    } catch (err) {
      console.error('Failed to create group:', err);
      throw err;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        messages,
        loadingChats,
        loadingMessages,
        typingUsers,
        setActiveChat,
        fetchChats,
        sendMessage,
        setTyping,
        reactToMessage,
        deleteMessage,
        startDirectChat,
        createGroup
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
