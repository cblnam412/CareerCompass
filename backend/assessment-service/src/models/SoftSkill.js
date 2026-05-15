import mongoose from 'mongoose';

const softSkillSchema = new mongoose.Schema(
  {
    softSkillName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  { timestamps: true },
);

softSkillSchema.index({ softSkillName: 1 });

export default mongoose.model('SoftSkill', softSkillSchema);
