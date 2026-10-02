import { Chat } from '../models/Chat.js';
import { ChatService } from '../services/chatService.js';
import { User } from '../models/User.js';

export const getUserChats = async (req, res) => {
  try {
    const chats = await ChatService.getChats(req.user._id);
    res.json({
      success: true,
      count: chats.length,
      chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getOrCreateChat = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required'
      });
    }

    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    let chat = await ChatService.getChatBetweenUsers(req.user._id, targetUserId);

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, targetUserId],
        isGroupChat: false
      });

      chat = await Chat.findById(chat._id)
        .populate('participants', 'username email avatar status lastSeen')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'username email avatar' }
        });
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const createGroupChat = async (req, res) => {
  try {
    const { participants, groupName } = req.body;
    if (!groupName || !groupName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    let members = [];
    if (typeof participants === 'string') {
      try {
        members = JSON.parse(participants);
      } catch {
        members = [participants];
      }
    } else if (Array.isArray(participants)) {
      members = participants;
    }

    if (members.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Group chat must have at least 1 other participant'
      });
    }

    const newChat = await ChatService.createGroupChat(members, groupName.trim(), req.user._id);

    const populatedChat = await Chat.findById(newChat._id)
      .populate('participants', 'username email avatar status lastSeen')
      .populate('groupAdmin', 'username email avatar');

    res.status(201).json({
      success: true,
      message: 'Group chat created successfully',
      chat: populatedChat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    })
      .populate('participants', 'username email avatar status lastSeen')
      .populate('groupAdmin', 'username email avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username email avatar' }
      });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
