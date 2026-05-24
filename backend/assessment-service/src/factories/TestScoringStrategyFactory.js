import { HOLLAND_ALIASES, TEST_TYPES, normalizeTestType } from '../constants/testType.js';
import HollandScoringStrategy from '../strategies/HollandScoringStrategy.js';
import MBTIScoringStrategy from '../strategies/MBTIScoringStrategy.js';
import { HttpError } from '../utils/httpError.js';

class TestScoringStrategyFactory {
  createStrategy(testType) {
    const normalizedType = normalizeTestType(testType);

    if (normalizedType === TEST_TYPES.MBTI) {
      return new MBTIScoringStrategy();
    }

    if (HOLLAND_ALIASES.includes(testType) || normalizedType === TEST_TYPES.HOLLAND) {
      return new HollandScoringStrategy();
    }

    throw new HttpError(400, 'Loại trắc nghiệm không hợp lệ. Chỉ chấp nhận MBTI hoặc Holland/RIASEC.');
  }
}

export default new TestScoringStrategyFactory();
