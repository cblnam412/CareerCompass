import express from 'express';
import {
  createPersonalityQuiz,
  createQuizQuestion,
  deletePersonalityQuiz,
  deleteQuizQuestion,
  getAllPersonalityQuizzes,
  getAttemptResult,
  getPersonalityQuizById,
  getPersonalityQuizByType,
  getQuizStatistics,
  getStudentQuizAttempts,
  importQuestionsFromExcel,
  submitPersonalityQuiz,
  updatePersonalityQuiz,
  updateQuizQuestion,
} from '../controllers/personalityQuizController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';
import { uploadExcelFile } from '../middlewares/upload.js';
import { validateObjectIdParam, validatePaginationQuery } from '../middlewares/validators.js';

const router = express.Router();

router.get('/personality-quizzes', validatePaginationQuery, getAllPersonalityQuizzes);
router.get('/personality-quizzes/type/:type', getPersonalityQuizByType);
router.get('/personality-quizzes/:quizId', validateObjectIdParam('quizId'), getPersonalityQuizById);
router.post('/personality-quizzes/:quizId/submit', verifyToken, validateObjectIdParam('quizId'), submitPersonalityQuiz);

router.get('/attempts/:attemptId', verifyToken, validateObjectIdParam('attemptId'), getAttemptResult);
router.get('/my-attempts', verifyToken, getStudentQuizAttempts);

router.post('/admin/personality-quizzes', verifyToken, checkAdminRole, createPersonalityQuiz);
router.patch('/admin/personality-quizzes/:quizId', verifyToken, checkAdminRole, validateObjectIdParam('quizId'), updatePersonalityQuiz);
router.put('/admin/personality-quizzes/:quizId', verifyToken, checkAdminRole, validateObjectIdParam('quizId'), updatePersonalityQuiz);
router.delete('/admin/personality-quizzes/:quizId', verifyToken, checkAdminRole, validateObjectIdParam('quizId'), deletePersonalityQuiz);
router.post('/admin/personality-quizzes/:quizId/questions', verifyToken, checkAdminRole, validateObjectIdParam('quizId'), createQuizQuestion);
router.patch('/admin/personality-quizzes/:quizId/questions/:questionId', verifyToken, checkAdminRole, validateObjectIdParam('quizId'), validateObjectIdParam('questionId'), updateQuizQuestion);
router.put('/admin/personality-quizzes/:quizId/questions/:questionId', verifyToken, checkAdminRole, validateObjectIdParam('quizId'), validateObjectIdParam('questionId'), updateQuizQuestion);
router.delete('/admin/personality-quizzes/:quizId/questions/:questionId', verifyToken, checkAdminRole, validateObjectIdParam('quizId'), validateObjectIdParam('questionId'), deleteQuizQuestion);
router.get('/admin/personality-quizzes/:quizId/statistics', verifyToken, checkAdminRole, validateObjectIdParam('quizId'), getQuizStatistics);
router.post('/admin/personality-quizzes/:quizId/import/excel', verifyToken, checkAdminRole, validateObjectIdParam('quizId'), uploadExcelFile, importQuestionsFromExcel);

export default router;
