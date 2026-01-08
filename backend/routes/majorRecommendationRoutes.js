import express from 'express';
import {
    getMajorRecommendation,
    createTrainingData,
    getModelStats,
    getTrainingDataList,
    importExternalTrainingData,
    getTrainingDataStats
} from '../controllers/majorRecommendationController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:studentId', verifyToken, getMajorRecommendation);
router.post('/training-data/create', verifyToken, createTrainingData);
router.post('/import-external-data', verifyToken, importExternalTrainingData);
router.get('/stats/model', verifyToken, getModelStats);
router.get('/stats/training-data', verifyToken, getTrainingDataStats);
router.get('/training-data', verifyToken, getTrainingDataList);

export default router;
