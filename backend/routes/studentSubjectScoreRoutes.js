import express from 'express';
import {
    getStudentAllSubjectScores,
    getStudentSubjectScore,
    addOrUpdateStudentScore,
    deleteStudentSubjectScore
} from '../controllers/studentSubjectScoreController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/student/:studentId/all-scores', verifyToken, getStudentAllSubjectScores);
router.get('/student/:studentId/subject/:subjectId', verifyToken, getStudentSubjectScore);
router.post('/student/:studentId/add-score', verifyToken, addOrUpdateStudentScore);
router.delete('/student/:studentId/subject/:subjectId', verifyToken, deleteStudentSubjectScore);

export default router;
