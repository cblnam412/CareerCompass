import mongoose from 'mongoose';

const personalityQuizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['MBTI', 'Holland'],
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true },
);

personalityQuizSchema.index({ type: 1, isActive: 1 });

export default mongoose.model('PersonalityQuiz', personalityQuizSchema);
