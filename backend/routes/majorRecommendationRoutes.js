import express from 'express';
import {
    getMajorRecommendation,
    createTrainingData,
    getModelStats,
    getTrainingDataList,
    importExternalTrainingData,
    getTrainingDataStats,
    exportTrainingDataTemplate,
    importTrainingDataFromExcel,
    trainRecommendationModel
} from '../controllers/majorRecommendationController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { uploadExcelFile } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/:studentId', verifyToken, getMajorRecommendation);
router.post('/training-data/create', verifyToken, createTrainingData);
router.post('/import-external-data', verifyToken, importExternalTrainingData);
router.get('/template/export', verifyToken, exportTrainingDataTemplate);
router.post('/import/excel', verifyToken, uploadExcelFile, importTrainingDataFromExcel);
router.post('/train/model', verifyToken, trainRecommendationModel);
router.get('/stats/model', verifyToken, getModelStats);
router.get('/stats/training-data', verifyToken, getTrainingDataStats);
router.get('/training-data', verifyToken, getTrainingDataList);

export default router;
