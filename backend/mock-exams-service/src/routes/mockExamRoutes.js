import express from 'express';
import {
  createMockExam,
  deleteMockExam,
  getAdminMockExamById,
  getAllExamResults,
  getAllAdminMockExams,
  getAllMockExams,
  getExamResult,
  getInternalStudentExamResults,
  getMockExamById,
  getMockExamAttempt,
  getMockExamForStudent,
  getStudentExamResults,
  getStudentExamStats,
  importQuestionsFromExcel,
  saveMockExamAttempt,
  submitMockExamAttempt,
  submitMockExam,
  updateMockExam,
} from '../controllers/mockExamController.js';
import { checkAdminRole, checkStudentRole, verifyToken } from '../middlewares/auth.js';
import { verifyInternalRequest } from '../middlewares/internalAuth.js';
import { uploadExcelFile } from '../middlewares/upload.js';
import { validateMockExamPayload, validateObjectIdParam, validatePaginationQuery } from '../middlewares/validators.js';

const router = express.Router();

router.get('/internal/students/:studentId/exam-results', verifyInternalRequest, validateObjectIdParam('studentId'), getInternalStudentExamResults);

router.get('/mock-exams', validatePaginationQuery, getAllMockExams);
router.get('/mock-exams/:examId', validateObjectIdParam('examId'), getMockExamById);

router.get('/student/mock-exams/attempts/:attemptId', verifyToken, checkStudentRole, validateObjectIdParam('attemptId'), getMockExamAttempt);
router.patch('/student/mock-exams/attempts/:attemptId', verifyToken, checkStudentRole, validateObjectIdParam('attemptId'), saveMockExamAttempt);
router.post('/student/mock-exams/attempts/:attemptId/submit', verifyToken, checkStudentRole, validateObjectIdParam('attemptId'), submitMockExamAttempt);
router.get('/student/mock-exams/:examId', verifyToken, checkStudentRole, validateObjectIdParam('examId'), getMockExamForStudent);
router.post('/student/mock-exams/:examId/submit', verifyToken, checkStudentRole, validateObjectIdParam('examId'), submitMockExam);
router.get('/student/exam-results', verifyToken, checkStudentRole, validatePaginationQuery, getStudentExamResults);
router.get('/student/exam-stats', verifyToken, checkStudentRole, getStudentExamStats);
router.get('/exam-results/:resultId', verifyToken, validateObjectIdParam('resultId'), getExamResult);

router.get('/admin/mock-exams', verifyToken, checkAdminRole, validatePaginationQuery, getAllAdminMockExams);
router.get('/admin/mock-exams/:examId', verifyToken, checkAdminRole, validateObjectIdParam('examId'), getAdminMockExamById);
router.post('/admin/mock-exams', verifyToken, checkAdminRole, validateMockExamPayload, createMockExam);
router.patch('/admin/mock-exams/:examId', verifyToken, checkAdminRole, validateObjectIdParam('examId'), validateMockExamPayload, updateMockExam);
router.put('/admin/mock-exams/:examId', verifyToken, checkAdminRole, validateObjectIdParam('examId'), validateMockExamPayload, updateMockExam);
router.delete('/admin/mock-exams/:examId', verifyToken, checkAdminRole, validateObjectIdParam('examId'), deleteMockExam);
router.post('/admin/mock-exams/:examId/import/excel', verifyToken, checkAdminRole, uploadExcelFile, importQuestionsFromExcel);
router.get('/admin/exam-results', verifyToken, checkAdminRole, validatePaginationQuery, getAllExamResults);

export default router;
