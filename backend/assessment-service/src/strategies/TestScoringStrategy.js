export default class TestScoringStrategy {
  calculateResult() {
    throw new Error('calculateResult() must be implemented by a concrete scoring strategy');
  }

  getInterpretation(resultScore) {
    return resultScore;
  }

  buildProfileUpdate() {
    return null;
  }
}
