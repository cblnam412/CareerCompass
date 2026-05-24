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

    const orderIndex = new Map(
      HOLLAND_ATTRIBUTES.map((attribute, index) => [attribute, index])
    );
  
    const code = Object.entries(scores)
      .sort(([leftAttr, leftScore], [rightAttr, rightScore]) => {
        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        return orderIndex.get(leftAttr) - orderIndex.get(rightAttr);
      })
      .slice(0, 3)
      .sort(([leftAttr], [rightAttr]) => {
        return orderIndex.get(leftAttr) - orderIndex.get(rightAttr);
      })
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
