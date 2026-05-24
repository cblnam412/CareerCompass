import { PersonalityQuizRepository, QuizQuestionRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { generateOptions, validateQuestionData } from '../utils/quizUtils.js';

const addOptions = (question, quiz) => {
  const data = question?.toObject ? question.toObject() : question;
  return {
    ...data,
    options: generateOptions(quiz.type, data.dimension, data.attribute, data.agreePreference, data.disagreePreference),
  };
};

const normalizeQuestionPayload = (payload = {}, quizType) => {
  const data = {
    content: payload.content?.trim(),
    order: payload.order !== undefined ? Number(payload.order) : undefined,
  };

  if (quizType === 'MBTI') {
    const dimension = payload.dimension;
    const parts = String(dimension || '').split('/');
    data.dimension = dimension;
    data.attribute = null;
    data.agreePreference = payload.agreePreference || parts[0] || null;
    data.disagreePreference = payload.disagreePreference || parts.find((item) => item !== data.agreePreference) || null;
  } else {
    data.dimension = null;
    data.attribute = payload.attribute;
    data.agreePreference = null;
    data.disagreePreference = null;
  }

  return data;
};

class QuizQuestionService {
  async getQuizOrFail(quizId) {
    const quiz = await PersonalityQuizRepository.findById(quizId);
    if (!quiz) throw new HttpError(404, 'Không tìm thấy bài trắc nghiệm');
    return quiz;
  }

  async getQuestionsWithOptions(quiz) {
    const questions = await QuizQuestionRepository.findByQuizId(quiz._id);
    return questions.map((question) => addOptions(question, quiz));
  }

  async create(quizId, payload = {}) {
    const quiz = await this.getQuizOrFail(quizId);
    const data = normalizeQuestionPayload(payload, quiz.type);
    const validation = validateQuestionData(data, quiz.type);
    if (!validation.isValid) throw new HttpError(400, 'Dữ liệu câu hỏi không hợp lệ', validation.errors);

    if (!data.order) {
      const lastQuestion = await QuizQuestionRepository.findLastByQuiz(quizId);
      data.order = (lastQuestion?.order || 0) + 1;
    }

    const question = await QuizQuestionRepository.create({ ...data, quizId });
    return addOptions(question, quiz);
  }

  async update(quizId, questionId, payload = {}) {
    const quiz = await this.getQuizOrFail(quizId);
    const existing = await QuizQuestionRepository.findOneByQuizAndId(quizId, questionId);
    if (!existing) throw new HttpError(404, 'Không tìm thấy câu hỏi');

    const merged = {
      ...existing.toObject(),
      ...payload,
    };
    const normalized = normalizeQuestionPayload(merged, quiz.type);
    const validation = validateQuestionData(normalized, quiz.type);
    if (!validation.isValid) throw new HttpError(400, 'Dữ liệu câu hỏi không hợp lệ', validation.errors);

    const updateData = {};
    ['content', 'order', 'dimension', 'attribute', 'agreePreference', 'disagreePreference'].forEach((field) => {
      if (normalized[field] !== undefined) updateData[field] = normalized[field];
    });

    const updated = await QuizQuestionRepository.updateById(questionId, updateData);
    return addOptions(updated, quiz);
  }

  async delete(quizId, questionId) {
    const question = await QuizQuestionRepository.deleteOneByQuizAndId(quizId, questionId);
    if (!question) throw new HttpError(404, 'Không tìm thấy câu hỏi');
    return question;
  }

  async importFromExcel(quizId, file) {
    const quiz = await this.getQuizOrFail(quizId);
    if (!file?.buffer) throw new HttpError(400, 'Vui lòng upload file Excel');

    const XLSX = await import('xlsx');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new HttpError(400, 'File Excel không có sheet');

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
    if (rows.length < 2) throw new HttpError(400, 'File Excel phải có header row');

    const lastQuestion = await QuizQuestionRepository.findLastByQuiz(quizId);
    let nextOrder = (lastQuestion?.order || 0) + 1;
    let questionsCreated = 0;
    let questionsSkipped = 0;
    const errors = [];

    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index];
      if (!row?.[0]) continue;

      const payload = quiz.type === 'MBTI'
        ? {
          content: String(row[0]).trim(),
          dimension: String(row[1]).trim(),
          agreePreference: String(row[2] || '').trim() || undefined,
          disagreePreference: String(row[3] || '').trim() || undefined,
          order: nextOrder,
        }
        : {
          content: String(row[0]).trim(),
          attribute: String(row[1]).trim(),
          order: nextOrder,
        };

      const data = normalizeQuestionPayload(payload, quiz.type);
      const validation = validateQuestionData(data, quiz.type);
      if (!validation.isValid) {
        questionsSkipped += 1;
        errors.push({ row: index + 1, content: payload.content, errors: validation.errors });
        continue;
      }

      try {
        await QuizQuestionRepository.create({ ...data, quizId });
        questionsCreated += 1;
        nextOrder += 1;
      } catch (error) {
        questionsSkipped += 1;
        errors.push({ row: index + 1, error: error.message });
      }
    }

    return {
      questionsCreated,
      questionsSkipped,
      totalRows: Math.max(rows.length - 1, 0),
      errors: errors.length > 0 ? errors : null,
    };
  }
}

export default new QuizQuestionService();
