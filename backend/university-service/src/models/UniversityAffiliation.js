import mongoose from 'mongoose';

const universityAffiliationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentIdNumber: {
      type: String,
      default: '',
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: true,
    },
    studentCardFront: {
      type: String,
      default: '',
    },
    studentCardBack: {
      type: String,
      default: '',
    },
    personalNote: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNote: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model('UniversityAffiliation', universityAffiliationSchema);
