import dotenv from 'dotenv';

dotenv.config();

const bool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes', 'y'].includes(String(value).toLowerCase());
};

export const env = {
  port: process.env.PORT || 5007,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/recommendation-service',
  studentMongoUrl: process.env.STUDENT_MONGO_URL || 'mongodb://localhost:27017/student-service',
  universityMongoUrl: process.env.UNIVERSITY_MONGO_URL || 'mongodb://localhost:27017/university-service',
  mockExamsMongoUrl: process.env.MOCK_EXAMS_MONGO_URL || 'mongodb://localhost:27017/mock-exams-service',
  assessmentMongoUrl: process.env.ASSESSMENT_MONGO_URL || 'mongodb://localhost:27017/assessment-service',
  jwtSecret: process.env.JWT_SECRET || 'doan1-dev-jwt-secret-change-me',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'doan1-dev-internal-token',
  autoSeedRecommendationData: bool(process.env.AUTO_SEED_RECOMMENDATION_DATA, true),
};

export const isDevelopment = env.nodeEnv === 'development';
