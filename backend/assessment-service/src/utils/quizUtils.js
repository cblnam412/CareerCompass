import mongoose from 'mongoose';
import { SUPPORTED_PERSONALITY_TEST_TYPES, normalizeTestType } from '../constants/testType.js';

export const QUIZ_TYPES = SUPPORTED_PERSONALITY_TEST_TYPES;
export const MBTI_DIMENSIONS = ['E/I', 'S/N', 'T/F', 'J/P'];
export const HOLLAND_ATTRIBUTES = ['R', 'I', 'A', 'S', 'E', 'C'];

const MBTI_OPTIONS = [
  { text: 'Hoan toan khong dong y', value: -2 },
  { text: 'Khong dong y', value: -1 },
  { text: 'Trung lap', value: 0 },
  { text: 'Dong y', value: 1 },
  { text: 'Hoan toan dong y', value: 2 },
];

const HOLLAND_OPTIONS = [
  { text: 'Rat thich', score: 5 },
  { text: 'Thich', score: 4 },
  { text: 'Binh thuong', score: 3 },
  { text: 'Khong thich', score: 2 },
  { text: 'Rat khong thich', score: 1 },
];

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const validatePersonalityQuizData = ({ title, type }, { partial = false } = {}) => {
  const errors = [];

  if (!partial || title !== undefined) {
    if (!title || !String(title).trim()) errors.push('title la bat buoc');
  }

  if (!partial || type !== undefined) {
    if (!QUIZ_TYPES.includes(normalizeTestType(type))) errors.push('type phai la MBTI hoac Holland/RIASEC');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateQuestionData = (data = {}, quizType, { partial = false } = {}) => {
  const errors = [];

  if (!partial || data.content !== undefined) {
    if (!data.content || !String(data.content).trim()) errors.push('content la bat buoc');
  }

  if (quizType === 'MBTI') {
    if (!partial || data.dimension !== undefined) {
      if (!MBTI_DIMENSIONS.includes(data.dimension)) errors.push('dimension khong hop le');
    }
    if (data.agreePreference !== undefined && data.agreePreference !== null) {
      const validPrefs = String(data.dimension || '').split('/');
      if (!validPrefs.includes(data.agreePreference)) errors.push('agreePreference khong khop dimension');
    }
    if (data.disagreePreference !== undefined && data.disagreePreference !== null) {
      const validPrefs = String(data.dimension || '').split('/');
      if (!validPrefs.includes(data.disagreePreference)) errors.push('disagreePreference khong khop dimension');
    }
  }

  if (quizType === 'Holland' && (!partial || data.attribute !== undefined)) {
    if (!HOLLAND_ATTRIBUTES.includes(data.attribute)) errors.push('attribute khong hop le');
  }

  return { isValid: errors.length === 0, errors };
};

export const generateOptions = (quizType, dimension, attribute, agreePreference, disagreePreference) => {
  if (quizType === 'Holland') return HOLLAND_OPTIONS;

  return MBTI_OPTIONS.map((option, index) => ({
    ...option,
    index,
    preference: option.value > 0 ? agreePreference : option.value < 0 ? disagreePreference : null,
    dimension,
  }));
};

export const validateAnswers = (answers, questions, quizType) => {
  if (!Array.isArray(answers)) {
    return { isValid: false, message: 'answers phai la mang' };
  }
  if (answers.length !== questions.length) {
    return { isValid: false, message: `Phai tra loi tat ca ${questions.length} cau hoi` };
  }

  const invalid = answers.find((answer) => {
    const number = Number(answer);
    if (Number.isNaN(number)) return true;
    return quizType === 'MBTI'
      ? !Number.isInteger(number) || number < 0 || number > 4
      : number < 1 || number > 5;
  });

  if (invalid !== undefined) return { isValid: false, message: 'Cau tra loi khong hop le' };
  return { isValid: true };
};

export const getQuizStats = (quiz, attempts = []) => {
  const stats = {
    totalAttempts: attempts.length,
    lastAttemptAt: attempts[0]?.attemptedAt || null,
  };

  if (quiz.type === 'MBTI') {
    stats.typeDistribution = attempts.reduce((acc, attempt) => {
      const type = attempt.resultScore?.type || attempt.interpretation;
      if (type) acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  if (quiz.type === 'Holland') {
    const totals = HOLLAND_ATTRIBUTES.reduce((acc, item) => ({ ...acc, [item]: 0 }), {});
    attempts.forEach((attempt) => {
      const scores = attempt.resultScore?.scores || attempt.interpretation || {};
      HOLLAND_ATTRIBUTES.forEach((attribute) => {
        totals[attribute] += Number(scores[attribute] || 0);
      });
    });
    stats.averageScores = HOLLAND_ATTRIBUTES.reduce((acc, attribute) => {
      acc[attribute] = attempts.length ? Number((totals[attribute] / attempts.length).toFixed(2)) : 0;
      return acc;
    }, {});
  }

  return stats;
};
