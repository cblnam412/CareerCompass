import mongoose from 'mongoose';

const careerKnowledgeSchema = new mongoose.Schema(
  {
    majorName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    hollandCodes: {
      type: [String],
      default: [],
    },
    mbtiTypes: {
      type: [String],
      default: [],
    },
    subjectWeights: {
      type: Map,
      of: Number,
      default: {},
    },
    softSkills: {
      type: [String],
      default: [],
    },
    demandScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 60,
    },
    salaryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 60,
    },
    salaryText: {
      type: String,
      default: '',
    },
    adviceTemplate: {
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

careerKnowledgeSchema.index({ majorName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
careerKnowledgeSchema.index({ keywords: 1 });
careerKnowledgeSchema.index({ hollandCodes: 1 });

export default mongoose.model('CareerKnowledge', careerKnowledgeSchema);
