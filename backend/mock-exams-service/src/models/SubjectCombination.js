import mongoose from 'mongoose';

const subjectCombinationSchema = new mongoose.Schema(
  {
    combinationName: {
      type: String,
      required: [true, 'Ma to hop la bat buoc'],
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
        message: 'To hop phai co dung 3 mon hoc',
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
