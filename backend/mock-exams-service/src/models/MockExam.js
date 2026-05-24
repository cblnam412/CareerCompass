import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Nội dung câu hỏi là bắt buộc'],
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(options) {
          return Array.isArray(options) && options.length === 4 && options.every((item) => String(item).trim());
        },
        message: 'Mỗi câu hỏi cần đúng 4 lựa chọn không rỗng',
      },
    },
    answer: {
      type: String,
      required: [true, 'Đáp án là bắt buộc'],
      trim: true,
      validate: {
        validator(answer) {
          return Array.isArray(this.options) && this.options.includes(answer);
        },
        message: 'Đáp án phải nằm trong các lựa chọn',
      },
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true },
);

const mockExamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề đề thi là bắt buộc'],
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Môn học là bắt buộc'],
    },
    duration: {
      type: Number,
      required: [true, 'Thời gian làm bài là bắt buộc'],
      min: [1, 'Thời gian làm bài phải lớn hơn 0'],
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator(questions) {
          return Array.isArray(questions) && questions.length > 0;
        },
        message: 'Đề thi phải có ít nhất 1 câu hỏi',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true },
);

mockExamSchema.index({ subject: 1, createdAt: -1 });
mockExamSchema.index({ title: 'text' });

export default mongoose.model('MockExam', mockExamSchema);
