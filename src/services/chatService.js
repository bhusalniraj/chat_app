import { Chat } from '../models/Chat.js';
import { User } from '../models/User.js';

export class ChatService {
  static async getChats(userId) {
    try {
      const chats = await Chat.find({
        participants: userId
      })
      .populate('participants', 'username email avatar status')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username email avatar'
        }
      })
      .sort({ lastMessageAt: -1 });
 
      return chats;
    } catch (error) {
      throw error;
    }
  }

  static async getChatBetweenUsers(userId1, userId2) {
    try {
      const chat = await Chat.findOne({
        participants: { $all: [userId1, userId2] }
      })
      .populate('participants', 'username email avatar status')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username email avatar'
        }
      });

      return chat;
    } catch (error) {
      throw error;
    }
  }

  static async createGroupChat(participants, groupName, adminId) {
    try {
      const chat = await Chat.create({
        participants: [...participants, adminId],
        isGroupChat: true,
        groupName,
        groupAdmin: adminId
      });

      return chat;
    } catch (error) {
      throw error;
    }
  }
}