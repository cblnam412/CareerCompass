import express from 'express';
import recommendationRoutes from './recommendationRoutes.js';

const router = express.Router();

router.use('/major-recommendations', recommendationRoutes);

export default router;
