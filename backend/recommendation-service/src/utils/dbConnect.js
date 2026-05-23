import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const externalConnections = {};

const connectExternal = async (name, url) => {
  const connection = mongoose.createConnection(url);
  await connection.asPromise();
  externalConnections[name] = connection;
  console.log(`Connected to ${name} database`);
  return connection;
};

export const connectDB = async () => {
  await mongoose.connect(env.mongoUrl);
  console.log(`Recommendation MongoDB connected: ${mongoose.connection.host}`);

  await Promise.all([
    connectExternal('student', env.studentMongoUrl),
    connectExternal('university', env.universityMongoUrl),
    connectExternal('mockExams', env.mockExamsMongoUrl),
    connectExternal('assessment', env.assessmentMongoUrl),
  ]);
};
