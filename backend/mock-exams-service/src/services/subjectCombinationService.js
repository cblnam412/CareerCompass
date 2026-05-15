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
      throw new HttpError(400, 'To hop phai co dung 3 mon hoc');
    }

    const uniqueSubjects = [...new Set(subjects.map(String))];
    if (uniqueSubjects.length !== 3) {
      throw new HttpError(400, 'To hop khong duoc trung mon hoc');
    }

    if (uniqueSubjects.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      throw new HttpError(400, 'Danh sach mon hoc khong hop le');
    }

    const found = await SubjectRepository.findMany({ _id: { $in: uniqueSubjects } }, '_id');
    if (found.length !== 3) {
      throw new HttpError(400, 'Mot hoac nhieu mon hoc khong ton tai');
    }

    return uniqueSubjects;
  }

  async create(payload) {
    const data = normalizePayload(payload);
    if (!data.combinationName) throw new HttpError(400, 'Ma to hop la bat buoc');

    data.subjects = await this.validateSubjects(data.subjects);

    const duplicate = await SubjectCombinationRepository.findDuplicate(data);
    if (duplicate) throw new HttpError(409, `To hop "${data.combinationName}" da ton tai`);

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
    if (!combination) throw new HttpError(404, 'Khong tim thay to hop mon');
    return combination;
  }

  async update(id, payload) {
    const existing = await SubjectCombinationRepository.findRawById(id);
    if (!existing) throw new HttpError(404, 'Khong tim thay to hop mon');

    const data = normalizePayload(payload);
    if (data.combinationName) {
      const duplicate = await SubjectCombinationRepository.findDuplicate({ ...data, excludeId: id });
      if (duplicate) throw new HttpError(409, `To hop "${data.combinationName}" da duoc su dung`);
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
    if (!deleted) throw new HttpError(404, 'Khong tim thay to hop mon');
    return deleted;
  }
}

export default new SubjectCombinationService();
