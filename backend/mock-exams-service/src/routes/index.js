import express from 'express';
import mockExamRoutes from './mockExamRoutes.js';
import statsRoutes from './statsRoutes.js';
import subjectCombinationRoutes from './subjectCombinationRoutes.js';
import subjectRoutes from './subjectRoutes.js';

const router = express.Router();

router.use('/subjects', subjectRoutes);
router.use('/subject-combinations', subjectCombinationRoutes);
router.use('/', statsRoutes);
router.use('/admin', statsRoutes);
router.use('/', mockExamRoutes);

export default router;
