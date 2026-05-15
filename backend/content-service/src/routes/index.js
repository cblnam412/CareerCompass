import express from 'express';
import forumRoutes from './forumRoutes.js';
import violationReportRoutes from './violationReportRoutes.js';

const router = express.Router();

router.use('/forum', forumRoutes);
router.use('/violations', violationReportRoutes);
router.use('/reports', violationReportRoutes);

export default router;
