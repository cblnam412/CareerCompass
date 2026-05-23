import { kmpScore, normalizeText } from './kmp.js';

export const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const toPlain = (item) => (item?.toObject ? item.toObject() : item);

export const toId = (value) => value?._id?.toString?.() || value?.toString?.() || value;

export const getMbtiType = (profile = {}) => {
  const result = profile.mbtiResult;
  if (!result) return '';
  if (typeof result === 'string') return result.toUpperCase();
  return String(result.type || result.mbti || result.result || '').toUpperCase();
};

export const getHollandScores = (profile = {}) => {
  const result = profile.hollandResult;
  if (!result) return {};
  if (result.scores && typeof result.scores === 'object') return result.scores;
  if (typeof result.code === 'string') {
    return Object.fromEntries(result.code.split('').map((code, index) => [code.toUpperCase(), 3 - index]));
  }
  if (typeof result.type === 'string') {
    return Object.fromEntries(result.type.split('').map((code, index) => [code.toUpperCase(), 3 - index]));
  }
  return {};
};

export const profileContextText = ({ profile, subjectsById, softSkillsById }) => {
  const subjectNames = (profile.academicTranscript || [])
    .map((item) => subjectsById.get(toId(item.subjectId))?.name)
    .filter(Boolean);
  const softSkillNames = (profile.softSkills || [])
    .map((id) => softSkillsById.get(toId(id))?.softSkillName)
    .filter(Boolean);

  return normalizeText([
    profile.province,
    profile.currentGradeLevel,
    getMbtiType(profile),
    Object.keys(getHollandScores(profile)).join(' '),
    subjectNames.join(' '),
    softSkillNames.join(' '),
  ].filter(Boolean).join(' '));
};

export const hollandFit = (profile, knowledge) => {
  const scores = getHollandScores(profile);
  const codes = (knowledge.hollandCodes || []).map((code) => String(code).toUpperCase());
  if (!codes.length || Object.keys(scores).length === 0) return 45;

  const maxScore = Math.max(...Object.values(scores).map(Number), 1);
  const matched = codes.reduce((sum, code) => sum + Number(scores[code] || 0), 0);
  return clamp((matched / (codes.length * maxScore)) * 100);
};

export const mbtiFit = (profile, knowledge) => {
  const mbti = getMbtiType(profile);
  const types = (knowledge.mbtiTypes || []).map((type) => String(type).toUpperCase());
  if (!mbti || !types.length) return 50;
  if (types.includes(mbti)) return 100;

  const bestSharedLetters = types.reduce((best, type) => {
    const shared = type.split('').reduce((count, letter, index) => count + (mbti[index] === letter ? 1 : 0), 0);
    return Math.max(best, shared);
  }, 0);

  return clamp(bestSharedLetters * 20);
};

export const academicFit = (profile, knowledge, subjectsById) => {
  const weights = knowledge.subjectWeights instanceof Map
    ? Object.fromEntries(knowledge.subjectWeights)
    : (knowledge.subjectWeights || {});
  const entries = Object.entries(weights);
  if (!entries.length) return profile.gpa ? clamp(profile.gpa * 10) : 50;

  const transcript = new Map(
    (profile.academicTranscript || []).map((item) => [
      normalizeText(subjectsById.get(toId(item.subjectId))?.name || ''),
      Number(item.score || 0),
    ]),
  );

  const totalWeight = entries.reduce((sum, [, weight]) => sum + Number(weight || 0), 0) || 1;
  const weighted = entries.reduce((sum, [subjectName, weight]) => {
    const score = transcript.get(normalizeText(subjectName));
    const fallback = profile.gpa || 6.5;
    return sum + (Number.isFinite(score) ? score : fallback) * Number(weight || 0);
  }, 0);

  return clamp((weighted / totalWeight) * 10);
};

export const softSkillFit = (profile, knowledge, softSkillsById) => {
  const required = (knowledge.softSkills || []).map(normalizeText);
  if (!required.length) return 50;

  const owned = (profile.softSkills || [])
    .map((id) => softSkillsById.get(toId(id))?.softSkillName)
    .filter(Boolean)
    .map(normalizeText);

  if (!owned.length) return 45;

  const matched = required.filter((skill) => owned.some((ownedSkill) => ownedSkill.includes(skill) || skill.includes(ownedSkill)));
  return clamp((matched.length / required.length) * 100);
};

export const admissionFit = (profile, candidate, subjectsById) => {
  const score = Number(candidate.admissionScore || 0);
  if (!score) return 70;

  const scores = (profile.academicTranscript || [])
    .map((item) => Number(item.score || 0))
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  const estimated = scores.length >= 3
    ? scores.slice(0, 3).reduce((sum, value) => sum + value, 0)
    : Number(profile.gpa || 6.5) * 3;

  return clamp(50 + (estimated - score) * 8);
};

export const targetUniversityFit = (profile, candidate) => {
  const targets = (profile.targetUniversityIds || []).map(toId);
  if (!targets.length || !candidate.universityId) return 60;
  return targets.includes(toId(candidate.universityId)) ? 100 : 45;
};

export const buildFeatureVector = ({ profile, knowledge, candidate, subjectsById, softSkillsById, contextText }) => [
  hollandFit(profile, knowledge),
  mbtiFit(profile, knowledge),
  academicFit(profile, knowledge, subjectsById),
  softSkillFit(profile, knowledge, softSkillsById),
  kmpScore(contextText, [...(knowledge.keywords || []), knowledge.majorName, knowledge.category].filter(Boolean)),
  admissionFit(profile, candidate || {}, subjectsById),
  targetUniversityFit(profile, candidate || {}),
  Number(knowledge.demandScore || 60),
  Number(knowledge.salaryLevel || 60),
];

export const featureNames = [
  'hollandFit',
  'mbtiFit',
  'academicFit',
  'softSkillFit',
  'keywordFit',
  'admissionFit',
  'targetUniversityFit',
  'demandScore',
  'salaryLevel',
];
