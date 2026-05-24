import mongoose from 'mongoose';

const subjectCombinationSchema = new mongoose.Schema(
  {
    combinationName: {
      type: String,
      required: [true, 'Mã tổ hợp là bắt buộc'],
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subjects: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
      ],
      validate: {
        validator(subjects) {
          return Array.isArray(subjects) && subjects.length === 3;
        },
        message: 'Tổ hợp phải có đúng 3 môn học',
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

subjectCombinationSchema.index(
  { combinationName: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

export default mongoose.model('SubjectCombination', subjectCombinationSchema);
