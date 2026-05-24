import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên môn học là bắt buộc'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true },
);

subjectSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
subjectSchema.index(
  { code: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 },
    partialFilterExpression: { code: { $type: 'string', $gt: '' } },
  },
);

export default mongoose.model('Subject', subjectSchema);
