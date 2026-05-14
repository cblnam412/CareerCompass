import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên trường là bắt buộc'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Mã trường là bắt buộc'],
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    region: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: [String],
      default: [],
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    logo: {
      type: String,
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

universitySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
universitySchema.index({ code: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('University', universitySchema);
