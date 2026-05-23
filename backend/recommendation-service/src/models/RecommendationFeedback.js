import mongoose from 'mongoose';

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recommendationId: {
      type: String,
      required: true,
      trim: true,
    },
    majorId: {
      type: String,
      default: '',
      trim: true,
    },
    isHelpful: {
      type: Boolean,
      required: true,
    },
    userSelectionStatus: {
      type: String,
      default: 'unknown',
      trim: true,
    },
    comments: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true },
);

recommendationFeedbackSchema.index({ userId: 1, recommendationId: 1 });

export default mongoose.model('RecommendationFeedback', recommendationFeedbackSchema);
