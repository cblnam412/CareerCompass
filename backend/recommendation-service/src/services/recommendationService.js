import mongoose from 'mongoose';
import CareerKnowledge from '../models/CareerKnowledge.js';
import RecommendationFeedback from '../models/RecommendationFeedback.js';
import RecommendationTrainingSample from '../models/RecommendationTrainingSample.js';
import { getExternalModels } from '../models/externalModels.js';
import { HttpError } from '../utils/httpError.js';
import { kmpAny, kmpScore, normalizeText } from '../utils/kmp.js';
import { RandomForestRegressor } from '../utils/randomForest.js';
import {
  buildFeatureVector,
  featureNames,
  profileContextText,
  toId,
  toPlain,
} from '../utils/featureEngineering.js';

const mapById = (items = []) => new Map(items.map((item) => [toId(item._id), item]));

const toKnowledgeObject = (item) => {
  const data = toPlain(item);
  if (data?.subjectWeights instanceof Map) data.subjectWeights = Object.fromEntries(data.subjectWeights);
  return data;
};

const candidateText = (candidate = {}, major = {}, university = {}) =>
  normalizeText([
    candidate.majorName,
    major.name,
    major.category,
    major.description,
    university.name,
    university.region,
    university.description,
    (candidate.admissionMethods || []).join(' '),
  ].filter(Boolean).join(' '));

const findKnowledgeForCandidate = (candidate, major, knowledgeList) => {
  const text = candidateText(candidate, major);
  const exact = knowledgeList.find((item) => normalizeText(item.majorName) === normalizeText(major?.name || candidate.majorName));
  if (exact) return exact;

  let best = null;
  let bestScore = -1;
  knowledgeList.forEach((item) => {
    const score = kmpScore(text, [item.majorName, item.category, ...(item.keywords || [])].filter(Boolean));
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  });

  return bestScore > 0 ? best : null;
};

const buildFallbackCandidate = (knowledge) => ({
  _id: `knowledge-${knowledge._id}`,
  majorId: knowledge._id,
  majorName: knowledge.majorName,
  universityName: 'Nhiều trường đào tạo',
  region: 'Toàn quốc',
  admissionScore: null,
  admissionMethods: [],
  isKnowledgeFallback: true,
});

const normalizeDisplayText = (value = '') =>
  String(value)
    .replace(/\bk\u1ef3\s+thu\u1eadt\b/gi, 'k\u1ef9 thu\u1eadt')
    .replace(/\bky\s+thuat\b/gi, 'k\u1ef9 thu\u1eadt')
    .replace(/\bChat\s+l\u01b0\u1ee3ng\b/g, 'Ch\u1ea5t l\u01b0\u1ee3ng')
    .replace(/\bchat\s+l\u01b0\u1ee3ng\b/g, 'ch\u1ea5t l\u01b0\u1ee3ng')
    .replace(/\bt\u00edch\s+Anh\b/g, 'ti\u1ebfng Anh')
    .replace(/\bT\u00edch\s+Anh\b/g, 'Ti\u1ebfng Anh');

const dedupeByMajor = (items = []) => {
  const byMajor = new Map();
  items.forEach((item) => {
    const key = normalizeText(item.majorName || item.name || item.majorId);
    const existing = byMajor.get(key);
    if (!existing) {
      byMajor.set(key, item);
      return;
    }

    const currentRank = [
      item.matchScore,
      Number(item.minScore || 0),
      item.universityName ? 1 : 0,
    ];
    const existingRank = [
      existing.matchScore,
      Number(existing.minScore || 0),
      existing.universityName ? 1 : 0,
    ];
    const isBetter = currentRank.some((value, index) => value > existingRank[index]
      && currentRank.slice(0, index).every((left, leftIndex) => left === existingRank[leftIndex]));

    if (isBetter) byMajor.set(key, item);
  });

  return [...byMajor.values()];
};

const explainRecommendation = ({ profile, knowledge, features, rfScore, finalScore, candidate }) => {
  const pairs = featureNames.map((name, index) => ({ name, value: Math.round(features[index]) }));
  const strengths = pairs
    .filter((item) => ['hollandFit', 'mbtiFit', 'academicFit', 'keywordFit', 'softSkillFit'].includes(item.name))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((item) => item.name);

  const reasonParts = [];
  if (strengths.includes('academicFit')) reasonParts.push('điểm học tập phù hợp với nhóm môn trong ngành');
  if (strengths.includes('hollandFit')) reasonParts.push('mã Holland có xu hướng gần với môi trường nghề này');
  if (strengths.includes('mbtiFit')) reasonParts.push('MBTI tương thích với cách làm việc của ngành');
  if (strengths.includes('keywordFit')) reasonParts.push('hồ sơ có nhiều dấu hiệu trùng với từ khóa nghề nghiệp');
  if (strengths.includes('softSkillFit')) reasonParts.push('kỹ năng mềm đang có hỗ trợ tốt cho ngành');

  const admissionNote = candidate?.admissionScore
    ? `Điểm chuẩn tham khảo ${candidate.admissionScore}; hệ thống ước tính mức phù hợp điểm là ${Math.round(features[5])}/100.`
    : 'Chưa có điểm chuẩn cụ thể cho lựa chọn này, nên hệ thống ưu tiên độ phù hợp học lực và sở thích.';

  const reason = [
    reasonParts.length ? `Phù hợp vì ${reasonParts.join(', ')}.` : 'Phù hợp dựa trên tổng hợp học lực, tính cách và nhu cầu thị trường.',
    admissionNote,
    knowledge.adviceTemplate,
  ].filter(Boolean).join(' ');

  return {
    reason,
    modelScore: Math.round(rfScore),
    finalScore: Math.round(finalScore),
    featureBreakdown: Object.fromEntries(pairs.map((item) => [item.name, item.value])),
  };
};

class RecommendationService {
  async getLookups() {
    const { Subject, SoftSkill } = getExternalModels();
    const [subjects, softSkills] = await Promise.all([
      Subject.find({ status: { $ne: 'inactive' } }).lean(),
      SoftSkill.find({}).lean(),
    ]);

    return {
      subjectsById: mapById(subjects),
      softSkillsById: mapById(softSkills),
    };
  }

  async getStudentProfile(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(400, 'userId không hợp lệ');
    }

    const { StudentProfile } = getExternalModels();
    const profile = await StudentProfile.findOne({ userId }).lean();
    if (!profile) {
      throw new HttpError(404, 'Không tìm thấy hồ sơ học sinh. Hãy cập nhật MBTI, Holland và điểm trước khi gợi ý.');
    }
    return profile;
  }

  async getCandidates(knowledgeList) {
    const { UniversityMajor, Major, University } = getExternalModels();
    const [universityMajors, majors, universities] = await Promise.all([
      UniversityMajor.find({}).limit(5000).lean(),
      Major.find({}).lean(),
      University.find({ status: { $ne: 'inactive' } }).lean(),
    ]);

    const majorMap = mapById(majors);
    const universityMap = mapById(universities);

    const candidates = universityMajors.map((item) => ({
      ...item,
      major: majorMap.get(toId(item.majorId)),
      university: universityMap.get(toId(item.universityId)),
    }));

    if (candidates.length > 0) return candidates;

    return knowledgeList.map(buildFallbackCandidate);
  }

  async trainForest() {
    const samples = await RecommendationTrainingSample.find({}).lean();
    const forest = new RandomForestRegressor({ trees: 25, maxDepth: 6, minSamples: 3, seed: 2026 });
    forest.fit(samples);
    return forest;
  }

  async getRecommendations(userId, options = {}) {
    const profile = await this.getStudentProfile(userId);
    const [knowledgeDocs, lookups, forest] = await Promise.all([
      CareerKnowledge.find({ status: 'active' }).lean(),
      this.getLookups(),
      this.trainForest(),
    ]);

    const knowledgeList = knowledgeDocs.map(toKnowledgeObject);
    if (!knowledgeList.length) {
      throw new HttpError(500, 'Recommendation knowledge base chưa có dữ liệu');
    }

    const candidates = await this.getCandidates(knowledgeList);
    const contextText = profileContextText({ profile, ...lookups });
    const scored = candidates.map((candidate) => {
      const major = candidate.major || {};
      const university = candidate.university || {};
      const knowledge = findKnowledgeForCandidate(candidate, major, knowledgeList)
        || knowledgeList.find((item) => kmpAny(item.majorName, [candidate.majorName]))
        || knowledgeList[0];

      const features = buildFeatureVector({
        profile,
        knowledge,
        candidate,
        ...lookups,
        contextText,
      });
      const rfScore = forest.predict(features);
      const keywordAgainstCandidate = kmpScore(contextText, [
        candidate.majorName,
        major.name,
        major.category,
        ...(knowledge.keywords || []),
      ].filter(Boolean));
      const finalScore = Math.max(0, Math.min(100, rfScore * 0.72 + keywordAgainstCandidate * 0.12 + features[2] * 0.1 + features[5] * 0.06));
      const explanation = explainRecommendation({ profile, knowledge, features, rfScore, finalScore, candidate });
      const displayMajorName = normalizeDisplayText(major.name || candidate.majorName || knowledge.majorName);

      return {
        recommendationId: toId(candidate._id),
        majorId: toId(candidate.majorId || knowledge._id),
        name: displayMajorName,
        majorName: displayMajorName,
        universityId: toId(candidate.universityId || ''),
        universityName: university.name || candidate.universityName || 'Nhiều trường đào tạo',
        region: university.region || candidate.region || 'Toàn quốc',
        minScore: Number(candidate.admissionScore || 0),
        admissionScore: candidate.admissionScore,
        admissionMethods: candidate.admissionMethods || [],
        category: major.category || knowledge.category,
        salary: knowledge.salaryText || 'Đang cập nhật',
        softSkills: knowledge.softSkills || [],
        matchScore: Math.round(finalScore),
        confidence: Math.round(finalScore),
        probability: Math.round(finalScore),
        reason: explanation.reason,
        advice: knowledge.adviceTemplate,
        model: {
          algorithm: 'RandomForest + KMP',
          randomForestScore: explanation.modelScore,
          finalScore: explanation.finalScore,
          featureBreakdown: explanation.featureBreakdown,
        },
      };
    });

    const minScore = Number(options.minScore ?? 50);
    const limit = Math.min(Number(options.limit || 12), 50);
    const uniqueScored = dedupeByMajor(scored);
    const recommendations = uniqueScored
      .filter((item) => item.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore || Number(b.minScore || 0) - Number(a.minScore || 0))
      .slice(0, limit);

    return {
      userId,
      profileCompleteness: this.getProfileCompleteness(profile),
      recommendations,
      meta: {
        algorithm: 'Hybrid RandomForestRegressor with KMP keyword matching',
        candidateCount: candidates.length,
        uniqueMajorCount: uniqueScored.length,
        returned: recommendations.length,
      },
    };
  }

  getProfileCompleteness(profile) {
    const checks = [
      Boolean(profile.mbtiResult),
      Boolean(profile.hollandResult),
      Array.isArray(profile.academicTranscript) && profile.academicTranscript.length > 0,
      Array.isArray(profile.softSkills) && profile.softSkills.length > 0,
      Boolean(profile.gpa),
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }

  async saveFeedback(requester, payload = {}) {
    const userId = payload.userId || requester.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new HttpError(400, 'userId không hợp lệ');
    if (!payload.recommendationId) throw new HttpError(400, 'recommendationId là bắt buộc');
    if (payload.isHelpful === undefined) throw new HttpError(400, 'isHelpful là bắt buộc');

    const feedback = await RecommendationFeedback.findOneAndUpdate(
      { userId, recommendationId: String(payload.recommendationId) },
      {
        userId,
        recommendationId: String(payload.recommendationId),
        majorId: payload.majorId ? String(payload.majorId) : '',
        isHelpful: Boolean(payload.isHelpful),
        userSelectionStatus: payload.userSelectionStatus || 'unknown',
        comments: payload.comments || '',
      },
      { upsert: true, new: true, runValidators: true },
    );

    await RecommendationTrainingSample.create({
      majorName: payload.majorName || payload.majorId || payload.recommendationId,
      features: payload.features && payload.features.length === featureNames.length
        ? payload.features.map(Number)
        : [60, 60, 60, 60, 60, 60, 60, 60, 60],
      label: payload.isHelpful ? 92 : 25,
      source: 'feedback',
    });

    return feedback;
  }
}

export default new RecommendationService();
