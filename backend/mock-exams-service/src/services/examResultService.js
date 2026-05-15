import mongoose from 'mongoose';
import { getInternalUsersByIds } from '../clients/authServiceClient.js';
import { ExamResultRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { getPagination, getSort } from '../utils/query.js';

const toPlain = (item) => (item?.toObject ? item.toObject() : item);

const attachUsers = async (results) => {
  const items = Array.isArray(results) ? results.map(toPlain) : [toPlain(results)];
  const userIds = [...new Set(items.map((item) => item?.studentId?.toString()).filter(Boolean))];

  if (userIds.length === 0) return Array.isArray(results) ? items : items[0];

  try {
    const users = await getInternalUsersByIds(userIds);
    const userMap = new Map(users.map((user) => [String(user._id), user]));
    items.forEach((item) => {
      const key = item.studentId?.toString();
      if (userMap.has(key)) item.studentId = userMap.get(key);
    });
  } catch (error) {
    items.forEach((item) => {
      item.studentLookupError = error.message;
    });
  }

  return Array.isArray(results) ? items : items[0];
};

class ExamResultService {
  async getResultById(resultId, requester) {
    const result = await ExamResultRepository.findById(resultId);
    if (!result) throw new HttpError(404, 'Ket qua thi khong ton tai');

    if (requester.role !== 'admin' && result.studentId.toString() !== requester.userId) {
      throw new HttpError(403, 'Ban khong co quyen xem ket qua nay');
    }

    return attachUsers(result);
  }

  async getStudentResults(studentId, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) throw new HttpError(400, 'Hoc sinh khong hop le');

    const { page, limit, skip } = getPagination(query, 10);
    const sort = getSort(query, '-takenAt');
    const [data, total] = await Promise.all([
      ExamResultRepository.findByStudent(studentId, { sort, skip, limit }),
      ExamResultRepository.countByStudent(studentId),
    ]);

    return {
      data,
      count: data.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getAllResults(query = {}) {
    const filter = {};
    if (query.studentId) filter.studentId = query.studentId;
    if (query.subject) filter.subject = query.subject;
    if (query.mockExamId) filter.mockExamId = query.mockExamId;

    const { page, limit, skip } = getPagination(query, 10);
    const sort = getSort(query, '-takenAt');
    const [rawData, total] = await Promise.all([
      ExamResultRepository.findMany(filter, null, { sort, skip, limit }),
      ExamResultRepository.count(filter),
    ]);
    const data = await attachUsers(rawData);

    return {
      data,
      count: data.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getStudentStats(studentId) {
    const results = await ExamResultRepository.findMany({ studentId }, null, { sort: '-takenAt' });

    if (results.length === 0) {
      return {
        totalExamsTaken: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        examHistory: [],
        scores: [],
      };
    }

    const scores = results.map((result) => result.scoreTotal);
    const averageScore = Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100;

    return {
      totalExamsTaken: results.length,
      averageScore,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      examHistory: results.map((result) => ({
        examTitle: result.mockExamId?.title || 'De thi',
        score: result.scoreTotal,
        takenAt: result.takenAt,
      })),
      scores,
    };
  }
}

export default new ExamResultService();
