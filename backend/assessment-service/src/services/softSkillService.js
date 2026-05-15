import { SoftSkillRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';
import { escapeRegex, getPagination } from '../utils/query.js';

class SoftSkillService {
  async getAll(query = {}) {
    const filter = {};
    if (query.search) {
      filter.softSkillName = { $regex: escapeRegex(query.search), $options: 'i' };
    }

    const { page, limit, skip } = getPagination(query, 10);
    const [data, total] = await Promise.all([
      SoftSkillRepository.findMany(filter, null, { sort: { softSkillName: 1 }, skip, limit }),
      SoftSkillRepository.count(filter),
    ]);

    return {
      data,
      count: data.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const skill = await SoftSkillRepository.findById(id);
    if (!skill) throw new HttpError(404, 'Khong tim thay ky nang mem');
    return skill;
  }

  async create(payload = {}) {
    const softSkillName = payload.softSkillName?.trim();
    if (!softSkillName) throw new HttpError(400, 'Ten ky nang mem la bat buoc');

    const duplicate = await SoftSkillRepository.findDuplicate(softSkillName);
    if (duplicate) throw new HttpError(409, 'Ky nang mem nay da ton tai');

    return SoftSkillRepository.create({ softSkillName });
  }

  async update(id, payload = {}) {
    const existing = await SoftSkillRepository.findById(id);
    if (!existing) throw new HttpError(404, 'Khong tim thay ky nang mem');

    const softSkillName = payload.softSkillName?.trim();
    if (!softSkillName) throw new HttpError(400, 'Ten ky nang mem la bat buoc');

    const duplicate = await SoftSkillRepository.findDuplicate(softSkillName, id);
    if (duplicate) throw new HttpError(409, 'Ten ky nang mem nay da ton tai');

    return SoftSkillRepository.updateById(id, { softSkillName });
  }

  async delete(id) {
    const skill = await SoftSkillRepository.deleteById(id);
    if (!skill) throw new HttpError(404, 'Khong tim thay ky nang mem');
    return skill;
  }
}

export default new SoftSkillService();
