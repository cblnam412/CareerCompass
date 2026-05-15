import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PersonalityQuiz',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    dimension: {
      type: String,
      enum: ['E/I', 'S/N', 'T/F', 'J/P', null],
      default: null,
    },
    attribute: {
      type: String,
      enum: ['R', 'I', 'A', 'S', 'E', 'C', null],
      default: null,
    },
    agreePreference: {
      type: String,
      enum: ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P', null],
      default: null,
    },
    disagreePreference: {
      type: String,
      enum: ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P', null],
      default: null,
    },
  },
  { timestamps: true },
);

quizQuestionSchema.index({ quizId: 1, order: 1 });

export default mongoose.model('QuizQuestion', quizQuestionSchema);
