import express from 'express';
import cors from 'cors';
import { env } from './src/config/env.js';
import { connectDB } from './src/utils/dbConnect.js';
import routes from './src/routes/index.js';
import { errorHandler, notFound } from './src/middlewares/errorHandler.js';
import seedService from './src/services/seedService.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Recommendation service dang hoat dong',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  if (env.autoSeedRecommendationData) {
    await seedService.seedDefaults();
  }

  app.listen(env.port, () => {
    console.log(`Recommendation service running on port ${env.port}`);
    console.log(`API URL: http://localhost:${env.port}/api`);
  });
};

start().catch((error) => {
  console.error('Recommendation service failed to start:', error);
  process.exit(1);
});

export default app;
