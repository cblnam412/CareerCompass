import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 5005,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/messaging-service',
  jwtSecret: process.env.JWT_SECRET || 'doan1-dev-jwt-secret-change-me',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
  universityServiceUrl: process.env.UNIVERSITY_SERVICE_URL || 'http://localhost:5001',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'doan1-dev-internal-token',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
};

export const isDevelopment = env.nodeEnv === 'development';
