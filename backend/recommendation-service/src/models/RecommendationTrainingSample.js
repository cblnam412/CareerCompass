import mongoose from 'mongoose';

const recommendationTrainingSampleSchema = new mongoose.Schema(
  {
    majorName: {
      type: String,
      required: true,
      trim: true,
    },
    features: {
      type: [Number],
      required: true,
    },
    label: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    source: {
      type: String,
      enum: ['seed', 'feedback', 'manual'],
      default: 'seed',
    },
  },
  { timestamps: true },
);

recommendationTrainingSampleSchema.index({ majorName: 1, source: 1 });

export default mongoose.model('RecommendationTrainingSample', recommendationTrainingSampleSchema);
