import express from 'express';
import {
    getAllMockExams,
    getMockExamById,
    createMockExam,
    updateMockExam,
    deleteMockExam
} from '../controllers/mockExamController.js';

const router = express.Router();

router.get('/mock-exams', getAllMockExams);
router.get('/mock-exams/:examId', getMockExamById);
router.post('/admin/mock-exams', createMockExam);
router.patch('/admin/mock-exams/:examId', updateMockExam);
router.delete('/admin/mock-exams/:examId', deleteMockExam);

export default router;
