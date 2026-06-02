import dotenv from 'dotenv';

dotenv.config();

const inferredAiProvider = process.env.AI_PROVIDER
  || (process.env.AI_API_KEY?.startsWith('gsk_') ? 'groq' : 'openai');

const defaultAiModel = inferredAiProvider === 'groq'
  ? 'llama-3.1-8b-instant'
  : 'gpt-4o-mini';

export const env = {
  port: process.env.PORT || 5005,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/messaging-service',
  jwtSecret: process.env.JWT_SECRET || 'doan1-dev-jwt-secret-change-me',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
  universityServiceUrl: process.env.UNIVERSITY_SERVICE_URL || 'http://localhost:5001',
  studentServiceUrl: process.env.STUDENT_SERVICE_URL || 'http://localhost:5003',
  recommendationServiceUrl: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:5007',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'doan1-dev-internal-token',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  aiChatEnabled: process.env.AI_CHAT_ENABLED !== 'false',
  aiProvider: inferredAiProvider,
  aiApiKey: process.env.AI_API_KEY || '',
  aiModel: process.env.AI_MODEL || defaultAiModel,
  aiTemperature: Number(process.env.AI_TEMPERATURE || 0.3),
  aiMaxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS || 800),
  aiContextMaxChars: Number(process.env.AI_CONTEXT_MAX_CHARS || 6000),
};

export const isDevelopment = env.nodeEnv === 'development';
