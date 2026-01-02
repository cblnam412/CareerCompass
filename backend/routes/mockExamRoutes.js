import express from 'express';
import multer from 'multer';
import {
    getAllMockExams,
    getMockExamById,
    createMockExam,
    updateMockExam,
    deleteMockExam,
    importQuestionsFromExcel
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

router.post('/admin/mock-exams', createMockExam);
router.patch('/admin/mock-exams/:examId', updateMockExam);
router.delete('/admin/mock-exams/:examId', deleteMockExam);
router.post('/admin/mock-exams/import/excel', upload.single('file'), importQuestionsFromExcel);
router.post('/admin/mock-exams/:examId/import/excel', upload.single('file'), importQuestionsFromExcel);

export default router;
