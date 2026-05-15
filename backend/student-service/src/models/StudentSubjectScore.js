import mongoose from 'mongoose';

const studentSubjectScoreSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      default: 0,
    },
    examCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalScore: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

studentSubjectScoreSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

export default mongoose.model('StudentSubjectScore', studentSubjectScoreSchema);
