import personalityQuizService from '../services/personalityQuizService.js';
import quizAttemptService from '../services/quizAttemptService.js';
import quizQuestionService from '../services/quizQuestionService.js';

export const getAllPersonalityQuizzes = async (req, res, next) => {
  try {
    const result = await personalityQuizService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lay danh sach bai trac nghiem thanh cong', ...result });
  } catch (error) {
    next(error);
  }
};

export const getPersonalityQuizById = async (req, res, next) => {
  try {
    const data = await personalityQuizService.getById(req.params.quizId);
    res.status(200).json({ success: true, message: 'Lay bai trac nghiem thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const getPersonalityQuizByType = async (req, res, next) => {
  try {
    const data = await personalityQuizService.getByType(req.params.type);
    res.status(200).json({ success: true, message: 'Lay bai trac nghiem theo loai thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const createPersonalityQuiz = async (req, res, next) => {
  try {
    const data = await personalityQuizService.create(req.body, req.userId);
    res.status(201).json({ success: true, message: 'Tao bai trac nghiem thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const updatePersonalityQuiz = async (req, res, next) => {
  try {
    const data = await personalityQuizService.update(req.params.quizId, req.body);
    res.status(200).json({ success: true, message: 'Cap nhat bai trac nghiem thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const deletePersonalityQuiz = async (req, res, next) => {
  try {
    await personalityQuizService.delete(req.params.quizId);
    res.status(200).json({ success: true, message: 'Xoa bai trac nghiem thanh cong' });
  } catch (error) {
    next(error);
  }
};

export const createQuizQuestion = async (req, res, next) => {
  try {
    const data = await quizQuestionService.create(req.params.quizId, req.body);
    res.status(201).json({ success: true, message: 'Tao cau hoi thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const updateQuizQuestion = async (req, res, next) => {
  try {
    const data = await quizQuestionService.update(req.params.quizId, req.params.questionId, req.body);
    res.status(200).json({ success: true, message: 'Cap nhat cau hoi thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const deleteQuizQuestion = async (req, res, next) => {
  try {
    await quizQuestionService.delete(req.params.quizId, req.params.questionId);
    res.status(200).json({ success: true, message: 'Xoa cau hoi thanh cong' });
  } catch (error) {
    next(error);
  }
};

export const submitPersonalityQuiz = async (req, res, next) => {
  try {
    const data = await personalityQuizService.submit(req.params.quizId, req.userId, req.body.answers);
    res.status(201).json({ success: true, message: 'Nop bai thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const getAttemptResult = async (req, res, next) => {
  try {
    const data = await quizAttemptService.getAttemptResult(req.params.attemptId, {
      userId: req.userId,
      role: req.role,
    });
    res.status(200).json({ success: true, message: 'Lay ket qua lam bai thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const getStudentQuizAttempts = async (req, res, next) => {
  try {
    const data = await quizAttemptService.getMyAttempts(req.userId);
    res.status(200).json({ success: true, message: 'Lay lich su lam bai thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const getQuizStatistics = async (req, res, next) => {
  try {
    const data = await personalityQuizService.getStatistics(req.params.quizId);
    res.status(200).json({ success: true, message: 'Lay thong ke bai trac nghiem thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const importQuestionsFromExcel = async (req, res, next) => {
  try {
    const data = await quizQuestionService.importFromExcel(req.params.quizId, req.file);
    res.status(201).json({ success: true, message: `Import thanh cong ${data.questionsCreated} cau hoi`, data });
  } catch (error) {
    next(error);
  }
};
