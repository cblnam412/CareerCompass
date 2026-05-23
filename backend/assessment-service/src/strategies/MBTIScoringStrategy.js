import { MBTI_DIMENSIONS } from '../utils/quizUtils.js';
import TestScoringStrategy from './TestScoringStrategy.js';

export default class MBTIScoringStrategy extends TestScoringStrategy {
  calculateResult(answers, questions) {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    questions.forEach((question, index) => {
      const answerIndex = Number(answers[index]);
      const weight = answerIndex - 2;
      if (weight === 0) return;

      const preference = weight > 0 ? question.agreePreference : question.disagreePreference;
      if (preference && scores[preference] !== undefined) {
        scores[preference] += Math.abs(weight);
      }
    });

    const type = MBTI_DIMENSIONS
      .map((dimension) => {
        const [left, right] = dimension.split('/');
        return scores[left] >= scores[right] ? left : right;
      })
      .join('');

    return { type, scores };
  }

  getInterpretation(resultScore) {
    return resultScore.type;
  }

  buildProfileUpdate(resultScore, completedAt = new Date()) {
    return {
      mbtiResult: {
        type: resultScore.type,
        scores: resultScore.scores,
        completedAt,
      },
    };
  }
}
