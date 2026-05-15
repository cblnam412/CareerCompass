import express from 'express';
import internalStudentRoutes from './internalStudentRoutes.js';
import studentProfileRoutes from './studentProfileRoutes.js';
import studentSubjectScoreRoutes from './studentSubjectScoreRoutes.js';

const router = express.Router();

router.use('/student-profile', studentProfileRoutes);
router.use('/student', studentSubjectScoreRoutes);
router.use('/internal/student', internalStudentRoutes);

export default router;
