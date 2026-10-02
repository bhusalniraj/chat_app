import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { Chat } from '../models/Chat.js';
import { config } from '../config/env.js';

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: true, // Allow local development clients on any port (5173, 8080, etc.)
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Map of userId -> socketId
  const onlineUsers = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] User connected: ${socket.user.username} (${userId})`);

    onlineUsers.set(userId, socket.id);

    // Update user status in DB
    try {
      await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: Date.now() });
    } catch (err) {
      console.error('Error updating online status:', err);
    }

    // Join personal user room
    socket.join(userId);

    // Auto-join all chats the user belongs to
    try {
      const userChats = await Chat.find({ participants: userId });
      userChats.forEach(chat => {
        socket.join(chat._id.toString());
      });
    } catch (err) {
      console.error('Error joining user chat rooms:', err);
    }

    // Broadcast online status to everyone
    io.emit('user-status', {
      userId,
      status: 'online',
      onlineUsers: Array.from(onlineUsers.keys())
    });

    // Provide online users list on request
    socket.on('get-online-users', () => {
      socket.emit('online-users-list', Array.from(onlineUsers.keys()));
    });

    // Join a specific chat room (e.g. newly created group chat)
    socket.on('join-chat', (chatId) => {
      if (chatId) {
        socket.join(chatId.toString());
      }
    });

    // Leave a specific chat room
    socket.on('leave-chat', (chatId) => {
      if (chatId) {
        socket.leave(chatId.toString());
      }
    });

    // Handle sending message
    socket.on('send-message', async (data) => {
      try {
        const { receiverId, chatId, content, messageType, fileUrl, fileName, fileSize, replyTo } = data;

        let chat = null;

        if (chatId) {
          chat = await Chat.findById(chatId);
        } else if (receiverId) {
          chat = await Chat.findOne({
            isGroupChat: false,
            participants: { $all: [userId, receiverId], $size: 2 }
          });

          if (!chat) {
            chat = await Chat.create({
              participants: [userId, receiverId],
              isGroupChat: false
            });
          }
        }

        if (!chat) {
          return socket.emit('message-error', { error: 'Chat not found' });
        }

        const messageData = {
          sender: userId,
          chatId: chat._id,
          content: content || '',
          messageType: messageType || 'text',
          replyTo: replyTo || null
        };

        if (!chat.isGroupChat && receiverId) {
          messageData.receiver = receiverId;
        }

        if (fileUrl) {
          messageData.fileUrl = fileUrl;
          messageData.fileName = fileName;
          messageData.fileSize = fileSize;
        }

        const message = await Message.create(messageData);

        // Update chat
        chat.lastMessage = message._id;
        chat.lastMessageAt = Date.now();
        chat.unreadCount = (chat.unreadCount || 0) + 1;
        await chat.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username email avatar')
          .populate('receiver', 'username email avatar')
          .populate({
            path: 'replyTo',
            populate: { path: 'sender', select: 'username avatar' }
          });

        // Broadcast to chat room
        const chatIdStr = chat._id.toString();
        socket.to(chatIdStr).emit('new-message', populatedMessage);

        // Also emit directly to receiver if 1-on-1 and not in room yet
        if (!chat.isGroupChat && receiverId) {
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('new-message', populatedMessage);
          }
        }

        // Send confirmation back to sender
        socket.emit('message-sent', populatedMessage);

      } catch (error) {
        console.error('Error in send-message socket:', error);
        socket.emit('message-error', { error: error.message });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { chatId, receiverId } = data;
      const payload = {
        chatId,
        userId,
        username: socket.user.username
      };

      if (chatId) {
        socket.to(chatId.toString()).emit('user-typing', payload);
      } else if (receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user-typing', payload);
        }
      }
    });

    socket.on('stop-typing', (data) => {
      const { chatId, receiverId } = data;
      const payload = {
        chatId,
        userId
      };

      if (chatId) {
        socket.to(chatId.toString()).emit('user-stop-typing', payload);
      } else if (receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user-stop-typing', payload);
        }
      }
    });

    // Handle message reaction
    socket.on('reaction', async (data) => {
      try {
        const { messageId, emoji, chatId } = data;
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIdx = message.reactions.findIndex(
          r => r.userId.toString() === userId
        );

        if (existingIdx > -1) {
          if (message.reactions[existingIdx].emoji === emoji) {
            message.reactions.splice(existingIdx, 1);
          } else {
            message.reactions[existingIdx].emoji = emoji || '❤️';
          }
        } else {
          message.reactions.push({
            userId,
            emoji: emoji || '❤️'
          });
        }

        await message.save();

        const payload = {
          messageId,
          reactions: message.reactions,
          chatId
        };

        if (chatId) {
          io.to(chatId.toString()).emit('message-reaction', payload);
        } else {
          io.emit('message-reaction', payload);
        }
      } catch (error) {
        console.error('Error handling reaction:', error);
      }
    });

    // Handle message read receipt
    socket.on('mark-read', async (data) => {
      const { messageId, chatId } = data;
      try {
        await Message.findByIdAndUpdate(messageId, {
          isRead: true,
          readAt: Date.now()
        });

        const payload = { messageId, userId, chatId };
        if (chatId) {
          socket.to(chatId.toString()).emit('message-read', payload);
        } else {
          io.emit('message-read', payload);
        }
      } catch (error) {
        console.error('Error marking message read:', error);
      }
    });

    // ============================================
    // WebRTC Calling Signaling
    // ============================================

    // Caller initiates a call
    socket.on('call-user', ({ userToCall, signalData, callType }) => {
      const recipientSocketId = onlineUsers.get(userToCall);
      console.log(`[Call] Call initiated from ${socket.user.username} to user ${userToCall}, type: ${callType}`);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('incoming-call', {
          signal: signalData,
          from: {
            _id: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar
          },
          callType: callType || 'video'
        });
      } else {
        socket.emit('call-failed', { message: 'User is offline' });
      }
    });

    // Receiver answers call
    socket.on('answer-call', ({ to, signal }) => {
      const callerSocketId = onlineUsers.get(to);
      console.log(`[Call] Answer call to ${to}`);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-accepted', {
          signal,
          from: socket.user._id
        });
      }
    });

    // Receiver rejects call
    socket.on('reject-call', ({ to }) => {
      const callerSocketId = onlineUsers.get(to);
      console.log(`[Call] Reject call to ${to}`);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-rejected', {
          from: socket.user._id
        });
      }
    });

    // Either party hangs up
    socket.on('end-call', ({ to }) => {
      const peerSocketId = onlineUsers.get(to);
      console.log(`[Call] End call with ${to}`);
      if (peerSocketId) {
        io.to(peerSocketId).emit('call-ended', {
          from: socket.user._id
        });
      }
    });

    // Relay ICE Candidates
    socket.on('ice-candidate', ({ to, candidate }) => {
      const peerSocketId = onlineUsers.get(to);
      if (peerSocketId) {
        io.to(peerSocketId).emit('ice-candidate', {
          candidate,
          from: socket.user._id
        });
      }
    });

    // Disconnection
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${socket.user.username} (${userId})`);

      onlineUsers.delete(userId);

      try {
        await User.findByIdAndUpdate(userId, {
          status: 'offline',
          lastSeen: Date.now()
        });
      } catch (err) {
        console.error('Error updating offline status:', err);
      }

      io.emit('user-status', {
        userId,
        status: 'offline',
        onlineUsers: Array.from(onlineUsers.keys())
      });
    });
  });

  return io;
};