import express from 'express';
import cors from 'cors';
import { env } from './src/config/env.js';
import { connectDB } from './src/utils/dbConnect.js';
import universityRoutes from './src/routes/index.js';
import { errorHandler, notFound } from './src/middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'University service đang hoạt động',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/universities', universityRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`University service running on port ${env.port}`);
  console.log(`API URL: http://localhost:${env.port}/api/universities`);
});

export default app;
