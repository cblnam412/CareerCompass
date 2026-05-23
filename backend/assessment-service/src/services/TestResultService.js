import testScoringStrategyFactory from '../factories/TestScoringStrategyFactory.js';

class TestResultService {
  calculateTestResult(testType, answers = [], questions = []) {
    const strategy = testScoringStrategyFactory.createStrategy(testType);
    const resultScore = strategy.calculateResult(answers, questions);

    return {
      resultScore,
      interpretation: strategy.getInterpretation(resultScore),
      profileUpdate: strategy.buildProfileUpdate(resultScore),
    };
  }
}

export default new TestResultService();
