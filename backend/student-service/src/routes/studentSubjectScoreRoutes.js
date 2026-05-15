import express from 'express';
import {
  addOrUpdateStudentScore,
  deleteStudentSubjectScore,
  getStudentAllSubjectScores,
  getStudentSubjectScore,
} from '../controllers/studentSubjectScoreController.js';
import { verifyToken } from '../middlewares/auth.js';
import { validateObjectIdParam, validateScorePayload } from '../middlewares/validators.js';

const router = express.Router();

router.use(verifyToken);

router.get('/:studentId/all-scores', validateObjectIdParam('studentId'), getStudentAllSubjectScores);
router.get('/:studentId/subject/:subjectId', validateObjectIdParam('studentId'), validateObjectIdParam('subjectId'), getStudentSubjectScore);
router.post('/:studentId/add-score', validateObjectIdParam('studentId'), validateScorePayload, addOrUpdateStudentScore);
router.delete('/:studentId/subject/:subjectId', validateObjectIdParam('studentId'), validateObjectIdParam('subjectId'), deleteStudentSubjectScore);

export default router;
