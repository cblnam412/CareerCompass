import mongoose from 'mongoose';

const majorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên ngành là bắt buộc'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Nhóm ngành là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true },
);

majorSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('Major', majorSchema);
