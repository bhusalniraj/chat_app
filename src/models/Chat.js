import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
  isGroupChat: { type: Boolean, default: false },
  groupName: { type: String, trim: true },
  groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupAvatar: { type: String }
}, { timestamps: true });

chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);