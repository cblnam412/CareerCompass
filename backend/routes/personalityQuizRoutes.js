import express from 'express';
import { verifyToken, checkAdminRole } from '../middlewares/authMiddleware.js';
import {
    getAllPersonalityQuizzes,
    getPersonalityQuizById,
    createPersonalityQuiz,
    updatePersonalityQuiz,
    deletePersonalityQuiz,
    createQuizQuestion,
    updateQuizQuestion,
    deleteQuizQuestion,
    submitPersonalityQuiz,
    getAttemptResult,
    getStudentQuizAttempts,
    getQuizStatistics,
    getPersonalityQuizByType
} from '../controllers/personalityQuizController.js';

const router = express.Router();

router.get('/personality-quizzes', getAllPersonalityQuizzes);
router.get('/personality-quizzes/type/:type', getPersonalityQuizByType);
router.get('/personality-quizzes/:quizId', getPersonalityQuizById);


router.post('/personality-quizzes/:quizId/submit', verifyToken, submitPersonalityQuiz);
router.get('/attempts/:attemptId', verifyToken, getAttemptResult);
router.get('/my-attempts', verifyToken, getStudentQuizAttempts);


router.post('/admin/personality-quizzes', verifyToken, checkAdminRole, createPersonalityQuiz);
router.patch('/admin/personality-quizzes/:quizId', verifyToken, checkAdminRole, updatePersonalityQuiz);
router.delete('/admin/personality-quizzes/:quizId', verifyToken, checkAdminRole, deletePersonalityQuiz);
router.post('/admin/personality-quizzes/:quizId/questions', verifyToken, checkAdminRole, createQuizQuestion);
router.patch('/admin/personality-quizzes/:quizId/questions/:questionId', verifyToken, checkAdminRole, updateQuizQuestion);
router.delete('/admin/personality-quizzes/:quizId/questions/:questionId', verifyToken, checkAdminRole, deleteQuizQuestion);
router.get('/admin/personality-quizzes/:quizId/statistics', verifyToken, checkAdminRole, getQuizStatistics);

export default router;
