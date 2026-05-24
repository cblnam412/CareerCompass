import xlsx from 'xlsx';
import { HttpError } from './httpError.js';

const firstValue = (row, keys) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const questionKeys = ['question', 'Question', 'Cau hoi', 'Câu hỏi', 'Noi dung', 'Nội dung', 'question_text'];
const answerKeys = ['answer', 'Answer', 'correct_answer', 'Correct Answer', 'Dap an', 'Đáp án', 'dap_an'];
const optionKeys = {
  A: ['A', 'a', 'option_a', 'Option A', 'Dap an A', 'Đáp án A'],
  B: ['B', 'b', 'option_b', 'Option B', 'Dap an B', 'Đáp án B'],
  C: ['C', 'c', 'option_c', 'Option C', 'Dap an C', 'Đáp án C'],
  D: ['D', 'd', 'option_d', 'Option D', 'Dap an D', 'Đáp án D'],
};

const normalizeAnswer = (answer, options) => {
  const trimmed = String(answer || '').trim();
  const upper = trimmed.toUpperCase();
  const indexByLetter = { A: 0, B: 1, C: 2, D: 3 };

  if (Object.prototype.hasOwnProperty.call(indexByLetter, upper)) {
    return options[indexByLetter[upper]];
  }

  return trimmed;
};

export const parseExcelQuestions = (buffer) => {
  if (!buffer) throw new HttpError(400, 'Vui lòng upload file Excel');

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new HttpError(400, 'File Excel không có sheet hợp lệ');

  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  return rows
    .map((row) => {
      const options = [
        firstValue(row, optionKeys.A),
        firstValue(row, optionKeys.B),
        firstValue(row, optionKeys.C),
        firstValue(row, optionKeys.D),
      ];

      const rawAnswer = firstValue(row, answerKeys);

      return {
        question: firstValue(row, questionKeys),
        options,
        answer: normalizeAnswer(rawAnswer, options),
      };
    })
    .filter((item) => item.question || item.options.some(Boolean) || item.answer);
};

export const validateQuestionsStructure = (questions) => {
  const errors = [];

  if (!Array.isArray(questions) || questions.length === 0) {
    return { valid: false, errors: ['Questions phải là mảng và không được rỗng'] };
  }

  questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;

    if (!question.question || typeof question.question !== 'string' || question.question.trim() === '') {
      errors.push(`${label}: Nội dung câu hỏi không hợp lệ`);
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      errors.push(`${label}: Cần đúng 4 lựa chọn`);
    } else {
      question.options.forEach((option, optionIndex) => {
        if (!option || typeof option !== 'string' || option.trim() === '') {
          errors.push(`${label}, Option ${optionIndex + 1}: Lựa chọn không được rỗng`);
        }
      });
    }

    if (!question.answer || typeof question.answer !== 'string' || question.answer.trim() === '') {
      errors.push(`${label}: Đáp án không hợp lệ`);
    } else if (Array.isArray(question.options) && !question.options.includes(question.answer)) {
      errors.push(`${label}: Đáp án không nằm trong các lựa chọn`);
    }
  });

  return { valid: errors.length === 0, errors };
};

export const validateQuestions = validateQuestionsStructure;
