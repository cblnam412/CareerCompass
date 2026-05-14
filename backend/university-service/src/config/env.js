import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/university-service',
  jwtSecret: process.env.JWT_SECRET || 'doan1-dev-jwt-secret-change-me',
};

export const isDevelopment = env.nodeEnv === 'development';
