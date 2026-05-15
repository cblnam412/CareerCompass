import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    content: { type: String, default: '', trim: true },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    messageType: {
      type: String,
      enum: ['text', 'file'],
      default: 'text',
      index: true,
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });
messageSchema.index({ content: 'text' });

export default mongoose.model('Message', messageSchema);
