import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    uniManagerId: { type: String, required: true, index: true },
    universityId: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    lastMessage: { type: String, default: '' },
    lastMessageType: {
      type: String,
      enum: ['text', 'file'],
      default: 'text',
    },
    lastMessageAt: Date,
  },
  { timestamps: true },
);

conversationSchema.index({ studentId: 1, uniManagerId: 1, universityId: 1 });
conversationSchema.index({ studentId: 1, isActive: 1, updatedAt: -1 });
conversationSchema.index({ uniManagerId: 1, isActive: 1, updatedAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
