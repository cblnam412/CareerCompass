export const TEST_TYPES = Object.freeze({
  MBTI: 'MBTI',
  HOLLAND: 'Holland',
  RIASEC: 'RIASEC',
});

export const SUPPORTED_PERSONALITY_TEST_TYPES = Object.freeze([
  TEST_TYPES.MBTI,
  TEST_TYPES.HOLLAND,
]);

export const HOLLAND_ALIASES = Object.freeze([
  TEST_TYPES.HOLLAND,
  TEST_TYPES.RIASEC,
]);

export const normalizeTestType = (testType) => {
  if (testType === TEST_TYPES.RIASEC) return TEST_TYPES.HOLLAND;
  return testType;
};
