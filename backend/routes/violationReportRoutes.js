import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
    createReport,
    getReports,
    getReportDetail,
    resolveReport,
    getMyReports
} from '../controllers/violationReportController.js';

const router = express.Router();

router.post('/report', verifyToken, createReport); 
router.get('/my-reports', verifyToken, getMyReports); 

router.get('/reports', verifyToken, getReports); 
router.get('/reports/:reportId', verifyToken, getReportDetail);
router.patch('/reports/:reportId/resolve', verifyToken, resolveReport); 

export default router;
