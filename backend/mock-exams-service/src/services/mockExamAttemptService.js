import mongoose from 'mongoose';
import { updateStudentScoreAfterExam } from '../clients/studentServiceClient.js';
import { ExamResultRepository, MockExamAttemptRepository } from '../repositories/index.js';
import { ATTEMPT_STATUS, getMockExamAttemptState } from '../states/mockExamAttemptState.js';
import { HttpError } from '../utils/httpError.js';
import mockExamService from './mockExamService.js';

const SUBMIT_GRACE_MS = 30000;

const toPlain = (item) => (item?.toObject ? item.toObject() : item);
const getQuestionId = (question) => String(question._id);

const sanitizeExamForStudent = (exam) => {
  const item = toPlain(exam);
  return {
    _id: item._id,
    title: item.title,
    duration: item.duration,
    subject: item.subject,
    questions: (item.questions || []).map((question) => ({
      _id: question._id,
      question: question.question,
      options: question.options,
    })),
    createdAt: item.createdAt,
  };
};

const getAttemptAnswerMap = (attempt) => {
  const map = new Map();
  (attempt?.answers || []).forEach((item) => {
    map.set(String(item.questionId), item.answer || '');
  });
  return map;
};

const serializeAnswers = (answerMap) =>
  [...answerMap.entries()].map(([questionId, answer]) => ({
    questionId,
    answer,
    answeredAt: new Date(),
  }));

const normalizeAnswerInput = (answers = {}, exam, { partial = true } = {}) => {
  const questionById = new Map(exam.questions.map((question) => [getQuestionId(question), question]));
  const normalized = new Map();

  if (Array.isArray(answers)) {
    answers.forEach((answer, index) => {
      const question = exam.questions[index];
      if (!question) return;
      const value = typeof answer === 'object' && answer !== null ? answer.answer : answer;
      normalized.set(getQuestionId(question), String(value || '').trim());
    });
  } else if (answers && typeof answers === 'object') {
    Object.entries(answers).forEach(([questionId, answer]) => {
      normalized.set(String(questionId), String(answer || '').trim());
    });
  } else {
    throw new HttpError(400, 'answers must be an array or object');
  }

  for (const [questionId, answer] of normalized.entries()) {
    const question = questionById.get(questionId);
    if (!question) throw new HttpError(400, 'Question does not belong to this exam');
    if (answer && !question.options.includes(answer)) {
      throw new HttpError(400, 'Answer does not match any question option');
    }
  }

  if (!partial) {
    exam.questions.forEach((question) => {
      const questionId = getQuestionId(question);
      if (!normalized.has(questionId)) normalized.set(questionId, '');
    });
  }

  return normalized;
};

const presentAttempt = (attempt, exam) => {
  const answerMap = getAttemptAnswerMap(attempt);
  const totalQuestions = exam.questions.length;
  const answeredCount = [...answerMap.values()].filter(Boolean).length;
  const expiresAt = attempt.expiresAt ? new Date(attempt.expiresAt) : null;
  const timeRemainingSeconds = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000))
    : 0;

  return {
    _id: attempt._id,
    attemptId: attempt._id,
    mockExamId: attempt.mockExamId,
    status: attempt.status,
    answers: Object.fromEntries(answerMap.entries()),
    startedAt: attempt.startedAt,
    lastSavedAt: attempt.lastSavedAt,
    submittedAt: attempt.submittedAt,
    expiresAt,
    timeRemainingSeconds,
    progress: {
      answeredCount,
      totalQuestions,
      percent: totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0,
    },
  };
};

class MockExamAttemptService {
  assertStudent(studentId) {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      throw new HttpError(401, 'Please sign in before taking an exam');
    }
  }

  async markExpiredIfNeeded(attempt) {
    if (attempt.status === ATTEMPT_STATUS.IN_PROGRESS && new Date() > attempt.expiresAt) {
      return MockExamAttemptRepository.updateById(attempt._id, { status: ATTEMPT_STATUS.EXPIRED });
    }
    return attempt;
  }

  async beginOrResume(examId, studentId) {
    this.assertStudent(studentId);
    const exam = await mockExamService.getById(examId);
    if (exam.status !== 'active') throw new HttpError(403, 'Mock exam is not available');

    const activeAttempt = await MockExamAttemptRepository.findActive(studentId, examId);
    const usableAttempt = activeAttempt ? await this.markExpiredIfNeeded(activeAttempt) : null;
    if (usableAttempt?.status === ATTEMPT_STATUS.IN_PROGRESS) {
      return { exam: sanitizeExamForStudent(exam), attempt: presentAttempt(usableAttempt, exam) };
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + exam.duration * 60 * 1000);
    const attempt = await MockExamAttemptRepository.create({
      studentId,
      mockExamId: examId,
      startedAt,
      expiresAt,
      answers: [],
    });

    return { exam: sanitizeExamForStudent(exam), attempt: presentAttempt(attempt, exam) };
  }

  async getById(attemptId, studentId) {
    this.assertStudent(studentId);
    const attempt = await MockExamAttemptRepository.findById(attemptId);
    if (!attempt) throw new HttpError(404, 'Attempt not found');
    if (String(attempt.studentId) !== String(studentId)) {
      throw new HttpError(403, 'You cannot access this attempt');
    }

    const exam = await mockExamService.getById(attempt.mockExamId);
    return { exam: sanitizeExamForStudent(exam), attempt: presentAttempt(attempt, exam) };
  }

  async save(attemptId, studentId, answers = {}) {
    this.assertStudent(studentId);
    const attempt = await MockExamAttemptRepository.findById(attemptId);
    if (!attempt) throw new HttpError(404, 'Attempt not found');
    if (String(attempt.studentId) !== String(studentId)) {
      throw new HttpError(403, 'You cannot update this attempt');
    }

    const state = getMockExamAttemptState(attempt);
    state.assertCanSave();

    const exam = await mockExamService.getById(attempt.mockExamId);
    const answerMap = getAttemptAnswerMap(attempt);
    const patchMap = normalizeAnswerInput(answers, exam, { partial: true });
    patchMap.forEach((answer, questionId) => {
      if (answer) answerMap.set(questionId, answer);
      else answerMap.delete(questionId);
    });

    const saved = await MockExamAttemptRepository.updateById(attemptId, {
      answers: serializeAnswers(answerMap),
      lastSavedAt: new Date(),
    });

    return presentAttempt(saved, exam);
  }

  async submit(attemptId, studentId, answers = null) {
    this.assertStudent(studentId);
    const attempt = await MockExamAttemptRepository.findById(attemptId);
    if (!attempt) throw new HttpError(404, 'Attempt not found');
    if (String(attempt.studentId) !== String(studentId)) {
      throw new HttpError(403, 'You cannot submit this attempt');
    }

    const state = getMockExamAttemptState(attempt);
    state.assertCanSubmit(new Date(), SUBMIT_GRACE_MS);

    const exam = await mockExamService.getById(attempt.mockExamId);
    const answerMap = getAttemptAnswerMap(attempt);
    const patchMap = normalizeAnswerInput(answers || {}, exam, { partial: false });
    patchMap.forEach((answer, questionId) => answerMap.set(questionId, answer));

    const resultPayload = this.buildResultPayload(exam, studentId, answerMap, attempt._id);
    const result = await ExamResultRepository.create(resultPayload);

    await MockExamAttemptRepository.updateById(attemptId, {
      answers: serializeAnswers(answerMap),
      status: ATTEMPT_STATUS.SUBMITTED,
      submittedAt: new Date(),
      lastSavedAt: new Date(),
      resultId: result._id,
    });

    try {
      await updateStudentScoreAfterExam(studentId, exam.subject._id || exam.subject, resultPayload.scoreTotal);
    } catch (error) {
      console.warn('Could not update student score after exam:', error.message);
    }

    return {
      result,
      correctCount: resultPayload.correctCount,
      totalQuestions: exam.questions.length,
      scorePercentage: resultPayload.scorePercentage,
      scoreTotal: resultPayload.scoreTotal,
    };
  }

  buildResultPayload(exam, studentId, answerMap, attemptId) {
    let correctCount = 0;
    const scoringDetails = exam.questions.map((question, index) => {
      const studentAnswer = answerMap.get(getQuestionId(question)) || '';
      const isCorrect = studentAnswer === question.answer;
      if (isCorrect) correctCount += 1;

      return {
        questionIndex: index + 1,
        question: question.question,
        studentAnswer,
        correctAnswer: question.answer,
        isCorrect,
      };
    });

    const totalQuestions = exam.questions.length;
    const scoreTotal = Math.round((correctCount / totalQuestions) * 10 * 100) / 100;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const weaknesses = scoringDetails
      .filter((detail) => !detail.isCorrect)
      .slice(0, 3)
      .map((detail) => `Cau ${detail.questionIndex}: ${detail.question.substring(0, 50)}...`);
    const strengths = scoringDetails
      .filter((detail) => detail.isCorrect)
      .slice(0, 3)
      .map((detail) => `Cau ${detail.questionIndex}`);

    return {
      studentId,
      mockExamId: exam._id,
      attemptId,
      subject: exam.subject._id || exam.subject,
      scoreTotal,
      correctCount,
      scorePercentage,
      scoreDetails: scoringDetails,
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Khong co'],
      strengths: strengths.length > 0 ? strengths : ['Tat ca'],
      improvementTips: correctCount >= totalQuestions * 0.8
        ? 'Ban lam tot. Hay tiep tuc on tap de nang cao kien thuc.'
        : 'Ban can on tap lai cac phan kien thuc con yeu va xem lai cac cau sai.',
    };
  }

  async submitExam(examId, studentId, answers = {}) {
    const { attempt } = await this.beginOrResume(examId, studentId);
    return this.submit(attempt.attemptId, studentId, answers);
  }
}

export default new MockExamAttemptService();
