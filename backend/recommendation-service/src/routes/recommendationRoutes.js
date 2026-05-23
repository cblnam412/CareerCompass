import express from 'express';
import {
  getMajorRecommendations,
  saveRecommendationFeedback,
  seedRecommendationData,
} from '../controllers/recommendationController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/:userId', verifyToken, getMajorRecommendations);
router.post('/feedback/save', verifyToken, saveRecommendationFeedback);
router.post('/admin/seed', verifyToken, checkAdminRole, seedRecommendationData);

export default router;
