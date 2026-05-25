import mongoose from 'mongoose';
import { updateStudentScoreAfterExam } from '../clients/studentServiceClient.js';
import { ExamResultRepository, MockExamRepository, SubjectRepository } from '../repositories/index.js';
import { parseExcelQuestions, validateQuestionsStructure } from '../utils/excelParser.js';
import { HttpError } from '../utils/httpError.js';
import { escapeRegex, getPagination, getSort } from '../utils/query.js';

const normalizeQuestion = (question) => ({
  question: question.question?.trim(),
  options: Array.isArray(question.options)
    ? question.options.map((option) => String(option).trim())
    : [],
  answer: question.answer?.trim(),
  explanation: question.explanation?.trim() || '',
});

const normalizeQuestions = (questions) => questions.map(normalizeQuestion);

const normalizeExamPayload = (payload = {}) => ({
  ...payload,
  title: payload.title?.trim(),
  duration: payload.duration !== undefined ? Number(payload.duration) : undefined,
  questions: Array.isArray(payload.questions) ? normalizeQuestions(payload.questions) : payload.questions,
});

const toPlain = (item) => (item?.toObject ? item.toObject() : item);

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

class MockExamService {
  async assertSubjectExists(subjectId) {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      throw new HttpError(400, 'Môn học không hợp lệ');
    }

    const subject = await SubjectRepository.findById(subjectId);
    if (!subject) throw new HttpError(400, 'Môn học không tồn tại');
    return subject;
  }

  validateDuration(duration) {
    if (typeof duration !== 'number' || Number.isNaN(duration) || duration <= 0) {
      throw new HttpError(400, 'Thời gian làm bài phải là số dương');
    }
  }

  validateQuestions(questions) {
    const validation = validateQuestionsStructure(questions);
    if (!validation.valid) {
      throw new HttpError(400, 'Dữ liệu câu hỏi không hợp lệ', validation.errors);
    }
  }

  async getAll(query = {}, options = {}) {
    const filter = {};
    if (query.search) {
      filter.title = { $regex: escapeRegex(query.search), $options: 'i' };
    }
    if (query.subject) filter.subject = query.subject;
    if (query.status) filter.status = query.status;

    const { page, limit, skip } = getPagination(query, 10);
    const sort = getSort(query, '-createdAt');
    const projection = options.includeQuestions ? null : '-questions';
    const [data, total] = await Promise.all([
      MockExamRepository.findMany(filter, projection, { sort, skip, limit }),
      MockExamRepository.count(filter),
    ]);

    return {
      data,
      count: data.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(examId) {
    const exam = await MockExamRepository.findById(examId);
    if (!exam) throw new HttpError(404, 'Đề thi không tồn tại');
    return exam;
  }

  async getPublicById(examId) {
    const exam = await this.getById(examId);
    return sanitizeExamForStudent(exam);
  }

  async create(payload) {
    const data = normalizeExamPayload(payload);
    if (!data.title || !data.subject || data.duration === undefined || !data.questions) {
      throw new HttpError(400, 'Yêu cầu thiếu: title, subject, duration, questions');
    }

    await this.assertSubjectExists(data.subject);
    this.validateDuration(data.duration);
    this.validateQuestions(data.questions);

    return MockExamRepository.create(data);
  }

  async update(examId, payload) {
    const existing = await MockExamRepository.findRawById(examId);
    if (!existing) throw new HttpError(404, 'Đề thi không tồn tại');

    const data = normalizeExamPayload(payload);
    if (data.subject !== undefined) await this.assertSubjectExists(data.subject);
    if (data.duration !== undefined) this.validateDuration(data.duration);
    if (data.questions !== undefined) this.validateQuestions(data.questions);

    const allowedFields = ['title', 'subject', 'duration', 'questions', 'status'];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) updateData[field] = data[field];
    });

    return MockExamRepository.updateById(examId, updateData);
  }

  async delete(examId) {
    const deleted = await MockExamRepository.deleteById(examId);
    if (!deleted) throw new HttpError(404, 'Đề thi không tồn tại');
    return deleted;
  }

  async importQuestionsFromExcel(examId, file, action = 'replace') {
    if (!file) throw new HttpError(400, 'Vui lòng upload file Excel');

    const questions = parseExcelQuestions(file.buffer);
    if (questions.length === 0) throw new HttpError(400, 'File Excel không chứa câu hỏi hợp lệ');

    this.validateQuestions(questions);

    if (!examId || examId === 'undefined') {
      return {
        questions,
        count: questions.length,
        preview: questions.slice(0, 3),
      };
    }

    const existing = await MockExamRepository.findRawById(examId);
    if (!existing) throw new HttpError(404, 'Đề thi không tồn tại');

    const exam = action === 'append'
      ? await MockExamRepository.appendQuestions(examId, questions)
      : await MockExamRepository.replaceQuestions(examId, questions);

    return {
      exam,
      importedCount: questions.length,
    };
  }

  async getForStudent(examId) {
    const exam = await this.getById(examId);

    return {
      _id: exam._id,
      title: exam.title,
      duration: exam.duration,
      subject: exam.subject,
      questions: exam.questions.map((question) => ({
        _id: question._id,
        question: question.question,
        options: question.options,
      })),
      createdAt: exam.createdAt,
    };
  }

  async submit(examId, studentId, answers) {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      throw new HttpError(401, 'Vui lòng đăng nhập');
    }

    if (!Array.isArray(answers)) {
      throw new HttpError(400, 'answers phải là mảng');
    }

    const exam = await this.getById(examId);
    if (answers.length !== exam.questions.length) {
      throw new HttpError(400, `Cần cung cấp đáp án cho cả ${exam.questions.length} câu hỏi`);
    }

    let correctCount = 0;
    const scoringDetails = exam.questions.map((question, index) => {
      const studentAnswer = answers[index] || '';
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
      .map((detail) => `Câu ${detail.questionIndex}: ${detail.question.substring(0, 50)}...`);
    const strengths = scoringDetails
      .filter((detail) => detail.isCorrect)
      .slice(0, 3)
      .map((detail) => `Câu ${detail.questionIndex}`);
    const improvementTips = correctCount >= totalQuestions * 0.8
      ? 'Bạn làm tốt. Hãy tiếp tục ôn tập để nâng cao kiến thức.'
      : 'Bạn cần ôn tập lại các phần kiến thức còn yếu và xem lại các câu sai.';

    const result = await ExamResultRepository.create({
      studentId,
      mockExamId: examId,
      subject: exam.subject._id || exam.subject,
      scoreTotal,
      scoreDetails: scoringDetails,
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Không có'],
      strengths: strengths.length > 0 ? strengths : ['Tất cả'],
      improvementTips,
    });

    try {
      await updateStudentScoreAfterExam(studentId, exam.subject._id || exam.subject, scoreTotal);
    } catch (error) {
      console.warn('Could not update student score after exam:', error.message);
    }

    return {
      result,
      correctCount,
      totalQuestions,
      scorePercentage,
    };
  }
}

export default new MockExamService();
