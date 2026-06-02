import { env } from '../config/env.js';
import { getMyMajorRecommendations } from '../clients/recommendationServiceClient.js';
import { getMyStudentProfile, getMySubjectScores } from '../clients/studentServiceClient.js';
import { searchMajors, searchUniversities } from '../clients/universityServiceClient.js';

const CAREER_KEYWORDS = [
  'ngành', 'nghe', 'nghề', 'career', 'hướng nghiệp', 'mbti', 'holland',
  'kỹ năng', 'ky nang', 'lương', 'luong', 'việc làm', 'viec lam',
];

const UNIVERSITY_KEYWORDS = [
  'trường', 'truong', 'đại học', 'dai hoc', 'điểm chuẩn', 'diem chuan',
  'xét tuyển', 'xet tuyen', 'tổ hợp', 'to hop', 'học phí', 'hoc phi',
];

const SCORE_KEYWORDS = [
  'điểm', 'diem', 'gpa', 'môn', 'mon', 'học lực', 'hoc luc',
  'cải thiện', 'cai thien', 'thi thử', 'thi thu',
];

const normalize = (value = '') => String(value).toLowerCase();
const includesAny = (message, keywords) => keywords.some((keyword) => normalize(message).includes(keyword));

const trimText = (value = '', max = 500) => {
  const text = String(value || '').trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const compactObject = (obj = {}) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== ''));

const sanitizeSubject = (subject) => {
  if (!subject || typeof subject !== 'object') return { subjectId: subject };
  return compactObject({
    subjectId: subject._id,
    name: subject.name,
    code: subject.code,
  });
};

const sanitizeProfile = (profile = {}) => compactObject({
  province: profile.province,
  gpa: profile.gpa,
  currentGradeLevel: profile.currentGradeLevel,
  mbtiResult: profile.mbtiResult,
  hollandResult: profile.hollandResult,
  academicTranscript: (profile.academicTranscript || []).slice(0, 20).map((item) => ({
    subject: sanitizeSubject(item.subjectId),
    score: item.score,
  })),
  softSkills: profile.softSkills,
  targetUniversities: (profile.targetUniversityIds || []).slice(0, 10).map((university) => (
    typeof university === 'object'
      ? compactObject({ id: university._id, name: university.name, province: university.province, region: university.region })
      : { id: university }
  )),
});

const sanitizeScores = (scores = []) => scores
  .filter((item) => Number(item.score) > 0 || Number(item.examCount) > 0)
  .slice(0, 30)
  .map((item) => compactObject({
    subjectName: item.subjectName,
    score: item.score,
    examCount: item.examCount,
  }));

const sanitizeRecommendations = (payload = {}) => (payload.recommendations || [])
  .slice(0, 6)
  .map((item) => compactObject({
    majorName: item.majorName || item.name,
    universityName: item.universityName,
    region: item.region,
    matchScore: item.matchScore || item.confidence,
    admissionScore: item.admissionScore || item.minScore,
    category: item.category,
    salary: item.salary,
    reason: trimText(item.reason, 600),
    advice: trimText(item.advice, 400),
  }));

const sanitizeUniversities = (payload = {}) => (payload.data || payload.universities || [])
  .slice(0, 5)
  .map((item) => compactObject({
    name: item.name,
    code: item.code,
    province: item.province,
    region: item.region,
    website: item.website,
    description: trimText(item.description, 300),
  }));

const sanitizeMajors = (items = []) => items
  .slice(0, 8)
  .map((item) => compactObject({
    name: item.name,
    category: item.category,
    description: trimText(item.description, 400),
  }));

const trimContext = (context) => {
  const json = JSON.stringify(context, null, 2);
  if (json.length <= env.aiContextMaxChars) return context;

  return {
    ...context,
    note: 'Context đã được rút gọn vì quá dài.',
    publicKnowledge: {
      universities: context.publicKnowledge.universities?.slice(0, 3) || [],
      majors: context.publicKnowledge.majors?.slice(0, 5) || [],
    },
    personal: {
      profile: context.personal.profile,
      scores: context.personal.scores?.slice(0, 12) || [],
      recommendations: context.personal.recommendations?.slice(0, 3) || [],
    },
  };
};

class AiContextBuilder {
  detectIntent(message = '') {
    const needsUniversityData = includesAny(message, UNIVERSITY_KEYWORDS);
    const needsCareerData = includesAny(message, CAREER_KEYWORDS);
    const needsScores = includesAny(message, SCORE_KEYWORDS);

    return {
      needsUniversityData,
      needsCareerData,
      needsScores,
      needsPersonalData: needsCareerData || needsScores || normalize(message).includes('em '),
    };
  }

  async build({ userId, token, message, usePersonalContext = false }) {
    const intent = this.detectIntent(message);
    const context = {
      publicKnowledge: {},
      personal: {},
      warnings: [],
    };

    const tasks = [];

    if (intent.needsUniversityData) {
      tasks.push(
        searchUniversities(message, 5)
          .then((data) => { context.publicKnowledge.universities = sanitizeUniversities(data); })
          .catch((error) => context.warnings.push(`Không lấy được dữ liệu trường: ${error.message}`)),
      );
    }

    if (intent.needsCareerData || intent.needsUniversityData) {
      tasks.push(
        searchMajors(message)
          .then((data) => { context.publicKnowledge.majors = sanitizeMajors(data); })
          .catch((error) => context.warnings.push(`Không lấy được dữ liệu ngành: ${error.message}`)),
      );
    }

    if (usePersonalContext && intent.needsPersonalData) {
      tasks.push(
        getMyStudentProfile(token)
          .then((data) => { context.personal.profile = sanitizeProfile(data); })
          .catch((error) => context.warnings.push(`Không lấy được hồ sơ cá nhân: ${error.message}`)),
      );

      if (intent.needsScores) {
        tasks.push(
          getMySubjectScores(userId, token)
            .then((data) => { context.personal.scores = sanitizeScores(data); })
            .catch((error) => context.warnings.push(`Không lấy được điểm học tập: ${error.message}`)),
        );
      }

      if (intent.needsCareerData) {
        tasks.push(
          getMyMajorRecommendations(userId, token)
            .then((data) => { context.personal.recommendations = sanitizeRecommendations(data); })
            .catch((error) => context.warnings.push(`Không lấy được gợi ý ngành: ${error.message}`)),
        );
      }
    }

    await Promise.all(tasks);

    const contextUsed = {
      profile: Boolean(context.personal.profile),
      scores: Boolean(context.personal.scores?.length),
      recommendations: Boolean(context.personal.recommendations?.length),
      universities: Boolean(context.publicKnowledge.universities?.length),
      majors: Boolean(context.publicKnowledge.majors?.length),
    };

    return {
      context: trimContext(context),
      contextUsed,
      intent,
    };
  }
}

export default new AiContextBuilder();
