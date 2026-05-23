import { HOLLAND_ATTRIBUTES } from '../utils/quizUtils.js';
import TestScoringStrategy from './TestScoringStrategy.js';

export default class HollandScoringStrategy extends TestScoringStrategy {
  calculateResult(answers, questions) {
    const totals = HOLLAND_ATTRIBUTES.reduce((acc, item) => ({ ...acc, [item]: 0 }), {});
    const counts = HOLLAND_ATTRIBUTES.reduce((acc, item) => ({ ...acc, [item]: 0 }), {});

    questions.forEach((question, index) => {
      const attribute = question.attribute;
      if (!HOLLAND_ATTRIBUTES.includes(attribute)) return;

      totals[attribute] += Number(answers[index]);
      counts[attribute] += 1;
    });

    const scores = HOLLAND_ATTRIBUTES.reduce((acc, attribute) => {
      acc[attribute] = counts[attribute] > 0
        ? Number((totals[attribute] / counts[attribute]).toFixed(2))
        : 0;
      return acc;
    }, {});

    const code = Object.entries(scores)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 3)
      .map(([attribute]) => attribute)
      .join('');

    return { scores, code };
  }

  getInterpretation(resultScore) {
    return resultScore.scores;
  }

  buildProfileUpdate(resultScore, completedAt = new Date()) {
    return {
      hollandResult: {
        scores: resultScore.scores,
        code: resultScore.code,
        completedAt,
      },
    };
  }
}
