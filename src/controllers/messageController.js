import { Message } from '../models/Message.js';
import { Chat } from '../models/Chat.js';

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied'
      });
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username email avatar')
      .populate('receiver', 'username email avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username avatar' }
      });

    // Mark messages as read where current user is receiver
    await Message.updateMany(
      {
        chatId,
        sender: { $ne: req.user._id },
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, receiverId, replyTo } = req.body;

    let chat = null;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    } else if (receiverId) {
      chat = await Chat.findOne({
        isGroupChat: false,
        participants: { $all: [req.user._id, receiverId], $size: 2 }
      });

      if (!chat) {
        chat = await Chat.create({
          participants: [req.user._id, receiverId],
          isGroupChat: false
        });
      }
    }

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const messageData = {
      chatId: chat._id,
      sender: req.user._id,
      content: content ? content.trim() : '',
      replyTo: replyTo || null
    };

    if (!chat.isGroupChat && receiverId) {
      messageData.receiver = receiverId;
    }

    if (req.file) {
      messageData.fileUrl = `/uploads/${req.file.filename}`;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;

      if (req.file.mimetype.startsWith('image/')) {
        messageData.messageType = 'image';
      } else if (req.file.mimetype.startsWith('audio/')) {
        messageData.messageType = 'audio';
      } else {
        messageData.messageType = 'file';
      }
    } else {
      messageData.messageType = req.body.messageType || 'text';
    }

    const message = await Message.create(messageData);

    // Update chat last message
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email avatar')
      .populate('receiver', 'username email avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username avatar' }
      });

    // Emit socket event if io is attached to app
    const io = req.app.get('io');
    if (io) {
      io.to(chat._id.toString()).emit('new-message', populatedMessage);
      if (!chat.isGroupChat && receiverId) {
        io.to(receiverId.toString()).emit('new-message', populatedMessage);
      }
    }

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji = '❤️' } = req.body;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const userIdStr = req.user._id.toString();
    const existingIndex = message.reactions.findIndex(
      r => r.userId.toString() === userIdStr
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({
        userId: req.user._id,
        emoji
      });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(message.chatId.toString()).emit('message-reaction', {
        messageId: message._id,
        reactions: message.reactions,
        chatId: message.chatId
      });
    }

    res.json({
      success: true,
      reactions: message.reactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await Message.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) {
      io.to(message.chatId.toString()).emit('message-deleted', {
        messageId: id,
        chatId: message.chatId
      });
    }

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
