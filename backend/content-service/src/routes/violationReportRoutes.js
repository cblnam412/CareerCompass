import express from 'express';
import {
  approveReport,
  createReport,
  getMyReports,
  getReportDetail,
  getReports,
  rejectReport,
  resolveReport,
} from '../controllers/violationReportController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/report', verifyToken, createReport);
router.get('/my-reports', verifyToken, getMyReports);

router.get('/reports', verifyToken, getReports);
router.get('/reports/:reportId', verifyToken, getReportDetail);
router.post('/reports/:reportId/approve', verifyToken, approveReport);
router.post('/reports/:reportId/reject', verifyToken, rejectReport);
router.patch('/reports/:reportId/resolve', verifyToken, resolveReport);

export default router;
