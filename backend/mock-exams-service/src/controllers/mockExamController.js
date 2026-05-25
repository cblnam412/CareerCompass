import examResultService from '../services/examResultService.js';
import mockExamAttemptService from '../services/mockExamAttemptService.js';
import mockExamService from '../services/mockExamService.js';

export const getAllMockExams = async (req, res, next) => {
  try {
    const result = await mockExamService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lấy danh sách đề thi thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const getMockExamById = async (req, res, next) => {
  try {
    const data = await mockExamService.getPublicById(req.params.examId);
    res.status(200).json({ success: true, message: 'Lấy chi tiết đề thi thành công', data });
  } catch (error) {
    next(error);
  }
};

export const getAllAdminMockExams = async (req, res, next) => {
  try {
    const result = await mockExamService.getAll(req.query, { includeQuestions: true });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getAdminMockExamById = async (req, res, next) => {
  try {
    const data = await mockExamService.getById(req.params.examId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createMockExam = async (req, res, next) => {
  try {
    const data = await mockExamService.create(req.body);
    res.status(201).json({ success: true, message: 'Tạo đề thi thành công', data });
  } catch (error) {
    next(error);
  }
};

export const updateMockExam = async (req, res, next) => {
  try {
    const data = await mockExamService.update(req.params.examId, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật đề thi thành công', data });
  } catch (error) {
    next(error);
  }
};

export const deleteMockExam = async (req, res, next) => {
  try {
    await mockExamService.delete(req.params.examId);
    res.status(200).json({ success: true, message: 'Xóa đề thi thành công' });
  } catch (error) {
    next(error);
  }
};

export const importQuestionsFromExcel = async (req, res, next) => {
  try {
    const data = await mockExamService.importQuestionsFromExcel(req.params.examId, req.file, req.body.action);
    const importedCount = data.importedCount ?? data.count;
    res.status(200).json({
      success: true,
      message: `Import thành công ${importedCount} câu hỏi`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMockExamForStudent = async (req, res, next) => {
  try {
    const data = await mockExamAttemptService.beginOrResume(req.params.examId, req.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const submitMockExam = async (req, res, next) => {
  try {
    const data = await mockExamAttemptService.submitExam(req.params.examId, req.userId, req.body.answers);
    res.status(201).json({ success: true, message: 'Nộp bài thi thành công', data });
  } catch (error) {
    next(error);
  }
};

export const getMockExamAttempt = async (req, res, next) => {
  try {
    const data = await mockExamAttemptService.getById(req.params.attemptId, req.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const saveMockExamAttempt = async (req, res, next) => {
  try {
    const data = await mockExamAttemptService.save(req.params.attemptId, req.userId, req.body.answers);
    res.status(200).json({ success: true, message: 'Attempt saved', data });
  } catch (error) {
    next(error);
  }
};

export const submitMockExamAttempt = async (req, res, next) => {
  try {
    const data = await mockExamAttemptService.submit(req.params.attemptId, req.userId, req.body.answers);
    res.status(201).json({ success: true, message: 'N盻冪 bﾃi thi thﾃnh cﾃｴng', data });
  } catch (error) {
    next(error);
  }
};

export const getExamResult = async (req, res, next) => {
  try {
    const data = await examResultService.getResultById(req.params.resultId, {
      userId: req.userId,
      role: req.role,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getStudentExamResults = async (req, res, next) => {
  try {
    const result = await examResultService.getStudentResults(req.userId, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getAllExamResults = async (req, res, next) => {
  try {
    const result = await examResultService.getAllResults(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getInternalStudentExamResults = async (req, res, next) => {
  try {
    const data = await examResultService.getInternalStudentResults(req.params.studentId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getStudentExamStats = async (req, res, next) => {
  try {
    const data = await examResultService.getStudentStats(req.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
