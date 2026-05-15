import studentProfileService from '../services/studentProfileService.js';
import studentSubjectScoreService from '../services/studentSubjectScoreService.js';

export const updateScoreAfterExam = async (req, res, next) => {
  try {
    const data = await studentSubjectScoreService.updateScoreAfterExam(
      req.params.studentId,
      req.params.subjectId,
      req.body.score,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const recalculateStudentScores = async (req, res, next) => {
  try {
    const data = await studentSubjectScoreService.recalculateStudentScores(req.params.studentId);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const updateAssessmentResults = async (req, res, next) => {
  try {
    const data = await studentProfileService.updateAssessmentResults(req.params.studentId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
