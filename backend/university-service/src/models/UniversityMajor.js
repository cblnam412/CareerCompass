import mongoose from 'mongoose';

const universityMajorSchema = new mongoose.Schema(
  {
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: true,
    },
    majorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Major',
      required: true,
    },
    majorName: {
      type: String,
      required: true,
      trim: true,
    },
    tuitionFee: {
      type: Number,
      default: 0,
    },
    duration: {
      type: mongoose.Schema.Types.Mixed,
      default: 0,
    },
    quota: {
      type: Number,
      default: 0,
    },
    admissionScore: {
      type: Number,
      default: null,
    },
    admissionMethods: {
      type: [String],
      default: [],
    },
    scoreUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

universityMajorSchema.index({ universityId: 1, majorId: 1 }, { unique: true });

export default mongoose.model('UniversityMajor', universityMajorSchema);
