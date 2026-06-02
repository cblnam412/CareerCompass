import mongoose from 'mongoose';

const aiConversationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'Trợ lý AI', trim: true },
    isActive: { type: Boolean, default: true, index: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: Date,
    metadata: {
      contextMode: { type: String, enum: ['none', 'public', 'personal'], default: 'public' },
      provider: { type: String, default: '' },
      model: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

aiConversationSchema.index({ userId: 1, isActive: 1, updatedAt: -1 });

export default mongoose.model('AiConversation', aiConversationSchema);
