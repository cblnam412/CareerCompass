import mongoose from 'mongoose';
import { externalConnections } from '../utils/dbConnect.js';

const transcriptItemSchema = new mongoose.Schema(
  {
    subjectId: mongoose.Schema.Types.ObjectId,
    score: Number,
  },
  { _id: false },
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    province: String,
    gpa: Number,
    currentGradeLevel: String,
    academicTranscript: [transcriptItemSchema],
    mbtiResult: mongoose.Schema.Types.Mixed,
    hollandResult: mongoose.Schema.Types.Mixed,
    softSkills: [mongoose.Schema.Types.ObjectId],
    targetUniversityIds: [mongoose.Schema.Types.ObjectId],
  },
  { timestamps: true },
);

const subjectSchema = new mongoose.Schema(
  {
    name: String,
    code: String,
    description: String,
    status: String,
  },
  { timestamps: true },
);

const softSkillSchema = new mongoose.Schema(
  {
    softSkillName: String,
  },
  { timestamps: true },
);

const universitySchema = new mongoose.Schema(
  {
    name: String,
    code: String,
    description: String,
    address: String,
    website: String,
    region: String,
    phone: [String],
    email: String,
    logo: String,
    status: String,
  },
  { timestamps: true },
);

const majorSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    description: String,
  },
  { timestamps: true },
);

const universityMajorSchema = new mongoose.Schema(
  {
    universityId: mongoose.Schema.Types.ObjectId,
    majorId: mongoose.Schema.Types.ObjectId,
    majorName: String,
    tuitionFee: Number,
    duration: mongoose.Schema.Types.Mixed,
    quota: Number,
    admissionScore: Number,
    admissionMethods: [String],
    scoreUpdatedAt: Date,
  },
  { timestamps: true },
);

const getModel = (connection, name, schema) => connection.models[name] || connection.model(name, schema);

export const getExternalModels = () => ({
  StudentProfile: getModel(externalConnections.student, 'StudentProfile', studentProfileSchema),
  Subject: getModel(externalConnections.mockExams, 'Subject', subjectSchema),
  SoftSkill: getModel(externalConnections.assessment, 'SoftSkill', softSkillSchema),
  University: getModel(externalConnections.university, 'University', universitySchema),
  Major: getModel(externalConnections.university, 'Major', majorSchema),
  UniversityMajor: getModel(externalConnections.university, 'UniversityMajor', universityMajorSchema),
});
