import mongoose from 'mongoose';

const aiMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiConversation',
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true },
    contextUsed: {
      profile: { type: Boolean, default: false },
      scores: { type: Boolean, default: false },
      recommendations: { type: Boolean, default: false },
      universities: { type: Boolean, default: false },
      majors: { type: Boolean, default: false },
    },
    safety: {
      blocked: { type: Boolean, default: false },
      reason: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

aiMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model('AiMessage', aiMessageSchema);
