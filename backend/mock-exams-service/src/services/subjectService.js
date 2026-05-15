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
    if (!data.name) throw new HttpError(400, 'Ten mon hoc la bat buoc');

    const duplicate = await SubjectRepository.findDuplicate(data);
    if (duplicate) {
      throw new HttpError(409, duplicate.name.toLowerCase() === data.name.toLowerCase()
        ? `Ten mon hoc "${data.name}" da ton tai`
        : `Ma mon hoc "${data.code}" da ton tai`);
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
    if (!subject) throw new HttpError(404, 'Khong tim thay mon hoc');
    return subject;
  }

  async update(id, payload) {
    const existing = await SubjectRepository.findById(id);
    if (!existing) throw new HttpError(404, 'Khong tim thay mon hoc');

    const data = normalizeSubjectPayload(payload);
    if (data.name || data.code) {
      const duplicate = await SubjectRepository.findDuplicate({ ...data, excludeId: id });
      if (duplicate) {
        const duplicatedName = data.name && duplicate.name.toLowerCase() === data.name.toLowerCase();
        throw new HttpError(409, duplicatedName ? `Ten mon hoc "${data.name}" da duoc su dung` : `Ma mon hoc "${data.code}" da duoc su dung`);
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
    if (!existing) throw new HttpError(404, 'Khong tim thay mon hoc');

    const [examCount, combinationCount] = await Promise.all([
      MockExamRepository.countBySubject(id),
      SubjectCombinationRepository.countBySubject(id),
    ]);

    if (examCount > 0 || combinationCount > 0) {
      throw new HttpError(409, 'Khong the xoa mon hoc dang duoc su dung');
    }

    return SubjectRepository.deleteById(id);
  }
}

export default new SubjectService();
