import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PersonalityQuiz',
      required: true,
      index: true,
    },
    rawAnswers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    resultScore: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    interpretation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ studentId: 1, attemptedAt: -1 });
quizAttemptSchema.index({ quizId: 1, attemptedAt: -1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
