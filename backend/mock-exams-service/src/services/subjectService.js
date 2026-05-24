import { MockExamRepository, SubjectCombinationRepository, SubjectRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { escapeRegex, getPagination, getSort } from '../utils/query.js';

const normalizeSubjectPayload = (payload = {}) => ({
  ...payload,
  name: payload.name?.trim(),
  code: payload.code?.trim()?.toUpperCase() || '',
  description: payload.description?.trim() || '',
});

class SubjectService {
  async create(payload) {
    const data = normalizeSubjectPayload(payload);
    if (!data.name) throw new HttpError(400, 'Tên môn học là bắt buộc');

    const duplicate = await SubjectRepository.findDuplicate(data);
    if (duplicate) {
      throw new HttpError(409, duplicate.name.toLowerCase() === data.name.toLowerCase()
        ? `Tên môn học "${data.name}" đã tồn tại`
        : `Mã môn học "${data.code}" đã tồn tại`);
    }

    return SubjectRepository.create(data);
  }

  async getAll(query = {}) {
    const filter = {};
    if (query.search) {
      const regex = { $regex: escapeRegex(query.search), $options: 'i' };
      filter.$or = [{ name: regex }, { code: regex }];
    }
    if (query.status) filter.status = query.status;

    const { page, limit, skip } = getPagination(query, 20);
    const sort = getSort(query, 'name');
    const [data, total] = await Promise.all([
      SubjectRepository.findMany(filter, null, { sort, skip, limit }),
      SubjectRepository.count(filter),
    ]);

    return {
      data,
      count: data.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const subject = await SubjectRepository.findById(id);
    if (!subject) throw new HttpError(404, 'Không tìm thấy môn học');
    return subject;
  }

  async update(id, payload) {
    const existing = await SubjectRepository.findById(id);
    if (!existing) throw new HttpError(404, 'Không tìm thấy môn học');

    const data = normalizeSubjectPayload(payload);
    if (data.name || data.code) {
      const duplicate = await SubjectRepository.findDuplicate({ ...data, excludeId: id });
      if (duplicate) {
        const duplicatedName = data.name && duplicate.name.toLowerCase() === data.name.toLowerCase();
        throw new HttpError(409, duplicatedName ? `Tên môn học "${data.name}" đã được sử dụng` : `Mã môn học "${data.code}" đã được sử dụng`);
      }
    }

    const allowedFields = ['name', 'code', 'description', 'status'];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) updateData[field] = data[field];
    });

    return SubjectRepository.updateById(id, updateData);
  }

  async delete(id) {
    const existing = await SubjectRepository.findById(id);
    if (!existing) throw new HttpError(404, 'Không tìm thấy môn học');

    const [examCount, combinationCount] = await Promise.all([
      MockExamRepository.countBySubject(id),
      SubjectCombinationRepository.countBySubject(id),
    ]);

    if (examCount > 0 || combinationCount > 0) {
      throw new HttpError(409, 'Không thể xóa môn học đang được sử dụng');
    }

    return SubjectRepository.deleteById(id);
  }
}

export default new SubjectService();
