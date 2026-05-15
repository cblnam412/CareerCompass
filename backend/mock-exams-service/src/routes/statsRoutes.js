import express from 'express';
import { getAdminStats } from '../controllers/statsController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/stats', verifyToken, checkAdminRole, getAdminStats);

export default router;
