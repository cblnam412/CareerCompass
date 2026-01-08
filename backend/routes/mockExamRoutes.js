import express from 'express';
import multer from 'multer';
import { verifyToken, checkAdminRole } from '../middlewares/authMiddleware.js';
import {
    getAllMockExams,
    getMockExamById,
    createMockExam,
    updateMockExam,
    deleteMockExam,
    importQuestionsFromExcel,
    getMockExamForStudent,
    submitMockExam,
    getExamResult,
    getStudentExamResults,
    getAllExamResults,
    getStudentExamStats
} from '../controllers/mockExamController.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream'
        ];
        
        if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

router.get('/mock-exams', getAllMockExams);
router.get('/mock-exams/:examId', getMockExamById);

router.get('/student/mock-exams/:examId', verifyToken, getMockExamForStudent);
router.post('/student/mock-exams/:examId/submit', verifyToken, submitMockExam);
router.get('/student/exam-results', verifyToken, getStudentExamResults);
router.get('/student/exam-stats', verifyToken, getStudentExamStats);
router.get('/exam-results/:resultId', verifyToken, getExamResult);

router.post('/admin/mock-exams', verifyToken, checkAdminRole, createMockExam);
router.patch('/admin/mock-exams/:examId', verifyToken, checkAdminRole, updateMockExam);
router.delete('/admin/mock-exams/:examId', verifyToken, checkAdminRole, deleteMockExam);
router.post('/admin/mock-exams/:examId/import/excel', verifyToken, checkAdminRole, upload.single('file'), importQuestionsFromExcel);
router.get('/admin/exam-results', verifyToken, checkAdminRole, getAllExamResults);

export default router;
