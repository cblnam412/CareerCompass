import { updateAssessmentResults } from '../clients/studentServiceClient.js';
import { normalizeTestType } from '../constants/testType.js';
import { PersonalityQuizRepository, QuizAttemptRepository, QuizQuestionRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { getPagination, getSort } from '../utils/query.js';
import {
  generateOptions,
  getQuizStats,
  QUIZ_TYPES,
  validateAnswers,
  validatePersonalityQuizData,
} from '../utils/quizUtils.js';
import testResultService from './TestResultService.js';

const quizQuestionService = await import('./quizQuestionService.js').then((module) => module.default);

const buildQuizFilter = (query = {}) => {
  const filter = { isActive: true };
  if (query.type) filter.type = normalizeTestType(query.type);
  return filter;
};

class PersonalityQuizService {
  async getAll(query = {}) {
    const filter = buildQuizFilter(query);
    const { page, limit, skip } = getPagination(query, 10);
    const sort = getSort(query, '-createdAt');
    const [data, total] = await Promise.all([
      PersonalityQuizRepository.findMany(filter, '-__v', { sort, skip, limit }).lean(),
      PersonalityQuizRepository.count(filter),
    ]);

    return {
      data,
      count: data.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(quizId) {
    const quiz = await PersonalityQuizRepository.findById(quizId).lean();
    if (!quiz) throw new HttpError(404, 'Khong tim thay bai trac nghiem');

    const questions = await QuizQuestionRepository.findByQuizId(quizId).lean();
    return {
      ...quiz,
      questions: questions.map((question) => ({
        ...question,
        options: generateOptions(quiz.type, question.dimension, question.attribute, question.agreePreference, question.disagreePreference),
      })),
    };
  }

  async getByType(type) {
    const normalizedType = normalizeTestType(type);
    if (!QUIZ_TYPES.includes(normalizedType)) {
      throw new HttpError(400, 'Loai trac nghiem khong hop le. Chi chap nhan MBTI hoac Holland/RIASEC.');
    }

    const quiz = await PersonalityQuizRepository.findActiveByType(normalizedType);
    if (!quiz) throw new HttpError(404, `Khong tim thay bai trac nghiem loai ${normalizedType}`);

    const questions = await quizQuestionService.getQuestionsWithOptions(quiz);
    return { ...quiz.toObject(), questions };
  }

  async create(payload = {}, userId) {
    const data = {
      title: payload.title?.trim(),
      description: payload.description?.trim() || '',
      type: normalizeTestType(payload.type),
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      createdBy: userId,
    };
    const validation = validatePersonalityQuizData(data);
    if (!validation.isValid) throw new HttpError(400, 'Du lieu bai trac nghiem khong hop le', validation.errors);

    return PersonalityQuizRepository.create(data);
  }

  async update(quizId, payload = {}) {
    const existing = await PersonalityQuizRepository.findById(quizId);
    if (!existing) throw new HttpError(404, 'Khong tim thay bai trac nghiem');

    const updateData = {};
    if (payload.title !== undefined) updateData.title = payload.title?.trim();
    if (payload.description !== undefined) updateData.description = payload.description?.trim() || '';
    if (payload.type !== undefined) updateData.type = normalizeTestType(payload.type);
    if (payload.isActive !== undefined) updateData.isActive = Boolean(payload.isActive);

    const validation = validatePersonalityQuizData(
      { title: updateData.title ?? existing.title, type: updateData.type ?? existing.type },
      { partial: true },
    );
    if (!validation.isValid) throw new HttpError(400, 'Du lieu bai trac nghiem khong hop le', validation.errors);

    return PersonalityQuizRepository.updateById(quizId, updateData);
  }

  async delete(quizId) {
    const quiz = await PersonalityQuizRepository.deleteById(quizId);
    if (!quiz) throw new HttpError(404, 'Khong tim thay bai trac nghiem');
    await QuizQuestionRepository.deleteByQuizId(quizId);
    return quiz;
  }

  async submit(quizId, studentId, answers = []) {
    const quiz = await PersonalityQuizRepository.findById(quizId);
    if (!quiz || !quiz.isActive) throw new HttpError(404, 'Khong tim thay bai trac nghiem dang hoat dong');

    const questions = await QuizQuestionRepository.findByQuizId(quizId);
    if (questions.length === 0) throw new HttpError(400, 'Bai trac nghiem chua co cau hoi');

    const answerValidation = validateAnswers(answers, questions, quiz.type);
    if (!answerValidation.isValid) throw new HttpError(400, answerValidation.message);

    const { resultScore, interpretation, profileUpdate } = testResultService.calculateTestResult(
      quiz.type,
      answers,
      questions,
    );

    const attempt = await QuizAttemptRepository.create({
      studentId,
      quizId,
      rawAnswers: answers,
      resultScore,
      interpretation,
      attemptedAt: new Date(),
    });

    try {
      await updateAssessmentResults(studentId, profileUpdate);
    } catch (error) {
      console.warn(`Could not update student profile assessment result: ${error.message}`);
    }

    return {
      attemptId: attempt._id,
      resultScore,
      interpretation,
      quizType: quiz.type,
    };
  }

  async getStatistics(quizId) {
    const quiz = await PersonalityQuizRepository.findById(quizId);
    if (!quiz) throw new HttpError(404, 'Khong tim thay bai trac nghiem');

    const attempts = await QuizAttemptRepository.findByQuizId(quizId);
    return { quiz, statistics: getQuizStats(quiz, attempts) };
  }
}

export default new PersonalityQuizService();
