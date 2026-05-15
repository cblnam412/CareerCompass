import express from 'express';
import {
  createMockExam,
  deleteMockExam,
  getAllExamResults,
  getAllMockExams,
  getExamResult,
  getInternalStudentExamResults,
  getMockExamById,
  getMockExamForStudent,
  getStudentExamResults,
  getStudentExamStats,
  importQuestionsFromExcel,
  submitMockExam,
  updateMockExam,
} from '../controllers/mockExamController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';
import { verifyInternalRequest } from '../middlewares/internalAuth.js';
import { uploadExcelFile } from '../middlewares/upload.js';
import { validateMockExamPayload, validateObjectIdParam, validatePaginationQuery } from '../middlewares/validators.js';

const router = express.Router();

router.get('/internal/students/:studentId/exam-results', verifyInternalRequest, validateObjectIdParam('studentId'), getInternalStudentExamResults);

router.get('/mock-exams', validatePaginationQuery, getAllMockExams);
router.get('/mock-exams/:examId', validateObjectIdParam('examId'), getMockExamById);

router.get('/student/mock-exams/:examId', verifyToken, validateObjectIdParam('examId'), getMockExamForStudent);
router.post('/student/mock-exams/:examId/submit', verifyToken, validateObjectIdParam('examId'), submitMockExam);
router.get('/student/exam-results', verifyToken, validatePaginationQuery, getStudentExamResults);
router.get('/student/exam-stats', verifyToken, getStudentExamStats);
router.get('/exam-results/:resultId', verifyToken, validateObjectIdParam('resultId'), getExamResult);

router.post('/admin/mock-exams', verifyToken, checkAdminRole, validateMockExamPayload, createMockExam);
router.patch('/admin/mock-exams/:examId', verifyToken, checkAdminRole, validateObjectIdParam('examId'), validateMockExamPayload, updateMockExam);
router.put('/admin/mock-exams/:examId', verifyToken, checkAdminRole, validateObjectIdParam('examId'), validateMockExamPayload, updateMockExam);
router.delete('/admin/mock-exams/:examId', verifyToken, checkAdminRole, validateObjectIdParam('examId'), deleteMockExam);
router.post('/admin/mock-exams/:examId/import/excel', verifyToken, checkAdminRole, uploadExcelFile, importQuestionsFromExcel);
router.get('/admin/exam-results', verifyToken, checkAdminRole, validatePaginationQuery, getAllExamResults);

export default router;
