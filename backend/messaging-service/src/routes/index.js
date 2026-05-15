import express from 'express';
import messageRoutes from './messageRoutes.js';

const router = express.Router();

router.use('/messages', messageRoutes);

export default router;
