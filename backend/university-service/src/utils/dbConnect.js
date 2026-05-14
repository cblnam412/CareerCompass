import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUrl);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};
