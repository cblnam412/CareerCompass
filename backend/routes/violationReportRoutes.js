import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
    createReport,
    getReports,
    getReportDetail,
    resolveReport,
    approveReport,
    rejectReport,
    getMyReports
} from '../controllers/violationReportController.js';

const router = express.Router();

router.post('/report', verifyToken, createReport); 
router.get('/my-reports', verifyToken, getMyReports); 

router.get('/reports', verifyToken, getReports); 
router.get('/reports/:reportId', verifyToken, getReportDetail);
router.patch('/reports/:reportId/resolve', verifyToken, resolveReport); 
router.post('/reports/:reportId/approve', verifyToken, approveReport);
router.post('/reports/:reportId/reject', verifyToken, rejectReport);

export default router;
