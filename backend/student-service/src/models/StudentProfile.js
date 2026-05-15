import mongoose from 'mongoose';

const transcriptItemSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
  },
  { _id: false },
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    province: {
      type: String,
      trim: true,
      default: '',
    },
    gpa: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    currentGradeLevel: {
      type: String,
      trim: true,
      default: '',
    },
    academicTranscript: {
      type: [transcriptItemSchema],
      default: [],
    },
    mbtiResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    hollandResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    softSkills: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    targetUniversityIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true },
);

studentProfileSchema.index({ 'academicTranscript.subjectId': 1 });

export default mongoose.model('StudentProfile', studentProfileSchema);
