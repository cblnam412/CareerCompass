import studentSubjectScoreService from '../services/studentSubjectScoreService.js';

export const getStudentAllSubjectScores = async (req, res, next) => {
  try {
    const data = await studentSubjectScoreService.getAllScores(req.params.studentId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getStudentSubjectScore = async (req, res, next) => {
  try {
    const data = await studentSubjectScoreService.getSubjectScore(req.params.studentId, req.params.subjectId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const addOrUpdateStudentScore = async (req, res, next) => {
  try {
    const data = await studentSubjectScoreService.addOrUpdateManualScore(
      req.params.studentId,
      req.body,
      { userId: req.userId, role: req.role },
    );
    res.status(200).json({
      success: true,
      message: 'Them/cap nhat diem thanh cong',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStudentSubjectScore = async (req, res, next) => {
  try {
    await studentSubjectScoreService.deleteSubjectScore(
      req.params.studentId,
      req.params.subjectId,
      { userId: req.userId, role: req.role },
    );
    res.status(200).json({
      success: true,
      message: 'Xoa diem thanh cong',
    });
  } catch (error) {
    next(error);
  }
};
