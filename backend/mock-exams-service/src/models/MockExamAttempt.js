import mongoose from 'mongoose';

const answerSnapshotSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    answer: {
      type: String,
      default: '',
      trim: true,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const mockExamAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    mockExamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockExam',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['inProgress', 'submitted', 'expired'],
      default: 'inProgress',
      index: true,
    },
    answers: {
      type: [answerSnapshotSchema],
      default: [],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastSavedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamResult',
      default: null,
    },
  },
  { timestamps: true },
);

mockExamAttemptSchema.index({ studentId: 1, mockExamId: 1, status: 1, startedAt: -1 });

export default mongoose.model('MockExamAttempt', mockExamAttemptSchema);
