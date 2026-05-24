import mongoose from 'mongoose';

const scoreDetailSchema = new mongoose.Schema(
  {
    questionIndex: Number,
    question: String,
    studentAnswer: {
      type: String,
      default: '',
    },
    correctAnswer: String,
    isCorrect: Boolean,
  },
  { _id: false },
);

const examResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Học sinh là bắt buộc'],
    },
    mockExamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockExam',
      required: [true, 'Đề thi là bắt buộc'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Môn học là bắt buộc'],
    },
    scoreTotal: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    scoreDetails: {
      type: [scoreDetailSchema],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvementTips: {
      type: String,
      default: '',
    },
    takenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

examResultSchema.index({ studentId: 1, takenAt: -1 });
examResultSchema.index({ mockExamId: 1 });
examResultSchema.index({ subject: 1 });

export default mongoose.model('ExamResult', examResultSchema);
