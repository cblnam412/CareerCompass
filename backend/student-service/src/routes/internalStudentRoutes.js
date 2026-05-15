import express from 'express';
import {
  recalculateStudentScores,
  updateAssessmentResults,
  updateScoreAfterExam,
} from '../controllers/internalStudentController.js';
import { verifyInternalRequest } from '../middlewares/internalAuth.js';
import { validateObjectIdParam } from '../middlewares/validators.js';

const router = express.Router();

router.use(verifyInternalRequest);

router.patch('/:studentId/subject/:subjectId/score', validateObjectIdParam('studentId'), validateObjectIdParam('subjectId'), updateScoreAfterExam);
router.post('/:studentId/recalculate', validateObjectIdParam('studentId'), recalculateStudentScores);
router.patch('/:studentId/assessment-results', validateObjectIdParam('studentId'), updateAssessmentResults);

export default router;
