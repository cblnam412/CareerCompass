import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(env.mongoUrl);
    console.log('Content service MongoDB connected');
  } catch (error) {
    console.error('Content service MongoDB connection error:', error.message);
    process.exit(1);
  }
};
