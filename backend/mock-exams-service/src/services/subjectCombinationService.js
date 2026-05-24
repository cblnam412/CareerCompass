import mongoose from 'mongoose';
import { SubjectCombinationRepository, SubjectRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { escapeRegex, getPagination, getSort } from '../utils/query.js';

const normalizePayload = (payload = {}) => ({
  ...payload,
  combinationName: payload.combinationName?.trim()?.toUpperCase(),
  description: payload.description?.trim() || '',
});

class SubjectCombinationService {
  async validateSubjects(subjects) {
    if (!Array.isArray(subjects) || subjects.length !== 3) {
      throw new HttpError(400, 'Tổ hợp phải có đúng 3 môn học');
    }

    const uniqueSubjects = [...new Set(subjects.map(String))];
    if (uniqueSubjects.length !== 3) {
      throw new HttpError(400, 'Tổ hợp không được trùng môn học');
    }

    if (uniqueSubjects.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      throw new HttpError(400, 'Danh sách môn học không hợp lệ');
    }

    const found = await SubjectRepository.findMany({ _id: { $in: uniqueSubjects } }, '_id');
    if (found.length !== 3) {
      throw new HttpError(400, 'Một hoặc nhiều môn học không tồn tại');
    }

    return uniqueSubjects;
  }

  async create(payload) {
    const data = normalizePayload(payload);
    if (!data.combinationName) throw new HttpError(400, 'Mã tổ hợp là bắt buộc');

    data.subjects = await this.validateSubjects(data.subjects);

    const duplicate = await SubjectCombinationRepository.findDuplicate(data);
    if (duplicate) throw new HttpError(409, `Tổ hợp "${data.combinationName}" đã tồn tại`);

    return SubjectCombinationRepository.create(data);
  }

  async getAll(query = {}) {
    const filter = {};
    if (query.search) {
      filter.combinationName = { $regex: escapeRegex(query.search), $options: 'i' };
    }
    if (query.status) filter.status = query.status;

    const { page, limit, skip } = getPagination(query, 20);
    const sort = getSort(query, 'combinationName');
    const [data, total] = await Promise.all([
      SubjectCombinationRepository.findMany(filter, null, { sort, skip, limit }),
      SubjectCombinationRepository.count(filter),
    ]);

    return {
      data,
      count: data.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const combination = await SubjectCombinationRepository.findById(id);
    if (!combination) throw new HttpError(404, 'Không tìm thấy tổ hợp môn');
    return combination;
  }

  async update(id, payload) {
    const existing = await SubjectCombinationRepository.findRawById(id);
    if (!existing) throw new HttpError(404, 'Không tìm thấy tổ hợp môn');

    const data = normalizePayload(payload);
    if (data.combinationName) {
      const duplicate = await SubjectCombinationRepository.findDuplicate({ ...data, excludeId: id });
      if (duplicate) throw new HttpError(409, `Tổ hợp "${data.combinationName}" đã được sử dụng`);
    }

    if (data.subjects !== undefined) {
      data.subjects = await this.validateSubjects(data.subjects);
    }

    const allowedFields = ['combinationName', 'description', 'subjects', 'status'];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) updateData[field] = data[field];
    });

    return SubjectCombinationRepository.updateById(id, updateData);
  }

  async delete(id) {
    const deleted = await SubjectCombinationRepository.deleteById(id);
    if (!deleted) throw new HttpError(404, 'Không tìm thấy tổ hợp môn');
    return deleted;
  }
}

export default new SubjectCombinationService();
