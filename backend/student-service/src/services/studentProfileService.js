import mongoose from 'mongoose';
import { getInternalUserById } from '../clients/authServiceClient.js';
import { getAllSubjects } from '../clients/mockExamsServiceClient.js';
import { getUniversitiesByIds } from '../clients/universityServiceClient.js';
import { StudentProfileRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';

const toPlain = (item) => (item?.toObject ? item.toObject() : item);
const toId = (value) => value?._id?.toString?.() || value?.toString?.() || value;

const normalizeTranscript = (academicTranscript = []) =>
  academicTranscript.map((item) => ({
    subjectId: item.subjectId,
    score: Number(item.score),
  }));

const buildUpdateData = (payload = {}) => {
  const allowedFields = [
    'province',
    'gpa',
    'currentGradeLevel',
    'mbtiResult',
    'hollandResult',
    'softSkills',
    'targetUniversityIds',
  ];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) updateData[field] = payload[field];
  });

  if (payload.gpa !== undefined) updateData.gpa = Number(payload.gpa);
  if (payload.softSkills !== undefined) updateData.softSkills = payload.softSkills;
  if (payload.targetUniversityIds !== undefined) updateData.targetUniversityIds = payload.targetUniversityIds;

  return updateData;
};

class StudentProfileService {
  async ensureUserExists(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(400, 'userId không hợp lệ');
    }

    try {
      return await getInternalUserById(userId);
    } catch (error) {
      throw new HttpError(error.status || 404, error.message || 'Không tìm thấy người dùng');
    }
  }

  async ensureProfile(userId) {
    let profile = await StudentProfileRepository.findByUserId(userId);
    if (profile) return profile;

    await this.ensureUserExists(userId);
    profile = await StudentProfileRepository.create({ userId });
    return profile;
  }

  async attachProfileLookups(profile) {
    const data = toPlain(profile);
    if (!data) return data;

    if (Array.isArray(data.academicTranscript) && data.academicTranscript.length > 0) {
      try {
        const subjects = await getAllSubjects();
        const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject]));
        data.academicTranscript = data.academicTranscript.map((item) => ({
          ...item,
          subjectId: subjectMap.get(String(item.subjectId)) || item.subjectId,
        }));
      } catch (error) {
        data.subjectLookupError = error.message;
      }
    }

    if (Array.isArray(data.targetUniversityIds) && data.targetUniversityIds.length > 0) {
      const universities = await getUniversitiesByIds(data.targetUniversityIds);
      const universityMap = new Map(universities.map((university) => [String(university._id), university]));
      data.targetUniversityIds = data.targetUniversityIds.map((id) => universityMap.get(String(id)) || id);
    }

    return data;
  }

  async getMyProfile(userId) {
    const profile = await this.ensureProfile(userId);
    return this.attachProfileLookups(profile);
  }

  async updateProfile(requester, payload = {}) {
    const currentUserId = requester.userId;
    const targetUserId = payload.userId || currentUserId;

    if (requester.role !== 'admin' && String(currentUserId) !== String(targetUserId)) {
      throw new HttpError(403, 'Bạn không có quyền cập nhật hồ sơ này');
    }

    await this.ensureProfile(targetUserId);
    const existingProfile = await StudentProfileRepository.findByUserId(targetUserId);
    const updateData = buildUpdateData(payload);

    if (payload.academicTranscript !== undefined) {
      const merged = new Map(
        (existingProfile?.academicTranscript || [])
          .filter((item) => item?.subjectId)
          .map((item) => [toId(item.subjectId), { subjectId: item.subjectId, score: item.score }]),
      );

      normalizeTranscript(payload.academicTranscript).forEach((item) => {
        merged.set(toId(item.subjectId), item);
      });

      updateData.academicTranscript = [...merged.values()];
    }

    const profile = await StudentProfileRepository.updateByUserId(targetUserId, updateData);
    if (!profile) throw new HttpError(404, 'Không tìm thấy hồ sơ học sinh');
    return this.attachProfileLookups(profile);
  }

  async updateAssessmentResults(userId, payload = {}) {
    await this.ensureProfile(userId);

    const updateData = {};
    if (payload.mbtiResult !== undefined) updateData.mbtiResult = payload.mbtiResult;
    if (payload.hollandResult !== undefined) updateData.hollandResult = payload.hollandResult;

    if (Object.keys(updateData).length === 0) {
      throw new HttpError(400, 'Cần có mbtiResult hoặc hollandResult để cập nhật');
    }

    const profile = await StudentProfileRepository.updateByUserId(userId, updateData);
    if (!profile) throw new HttpError(404, 'Không tìm thấy hồ sơ học sinh');
    return profile;
  }
}

export default new StudentProfileService();
