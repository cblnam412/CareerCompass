import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Noi dung cau hoi la bat buoc'],
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(options) {
          return Array.isArray(options) && options.length === 4 && options.every((item) => String(item).trim());
        },
        message: 'Moi cau hoi can dung 4 lua chon khong rong',
      },
    },
    answer: {
      type: String,
      required: [true, 'Dap an la bat buoc'],
      trim: true,
      validate: {
        validator(answer) {
          return Array.isArray(this.options) && this.options.includes(answer);
        },
        message: 'Dap an phai nam trong cac lua chon',
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
      required: [true, 'Tieu de de thi la bat buoc'],
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Mon hoc la bat buoc'],
    },
    duration: {
      type: Number,
      required: [true, 'Thoi gian lam bai la bat buoc'],
      min: [1, 'Thoi gian lam bai phai lon hon 0'],
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator(questions) {
          return Array.isArray(questions) && questions.length > 0;
        },
        message: 'De thi phai co it nhat 1 cau hoi',
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
