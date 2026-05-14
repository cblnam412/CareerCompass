import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    DOB: Date,
    studentId: String,
    address: String,
    avatar: String,
    role: {
      type: String,
      enum: ['admin', 'uniManager', 'uniRep', 'student'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'banned'],
      default: 'active',
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
    },
    banReleaseDate: Date,
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
