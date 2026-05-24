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
    if (!skill) throw new HttpError(404, 'Không tìm thấy kỹ năng mềm');
    return skill;
  }

  async create(payload = {}) {
    const softSkillName = payload.softSkillName?.trim();
    if (!softSkillName) throw new HttpError(400, 'Tên kỹ năng mềm là bắt buộc');

    const duplicate = await SoftSkillRepository.findDuplicate(softSkillName);
    if (duplicate) throw new HttpError(409, 'Kỹ năng mềm này đã tồn tại');

    return SoftSkillRepository.create({ softSkillName });
  }

  async update(id, payload = {}) {
    const existing = await SoftSkillRepository.findById(id);
    if (!existing) throw new HttpError(404, 'Không tìm thấy kỹ năng mềm');

    const softSkillName = payload.softSkillName?.trim();
    if (!softSkillName) throw new HttpError(400, 'Tên kỹ năng mềm là bắt buộc');

    const duplicate = await SoftSkillRepository.findDuplicate(softSkillName, id);
    if (duplicate) throw new HttpError(409, 'Tên kỹ năng mềm này đã tồn tại');

    return SoftSkillRepository.updateById(id, { softSkillName });
  }

  async delete(id) {
    const skill = await SoftSkillRepository.deleteById(id);
    if (!skill) throw new HttpError(404, 'Không tìm thấy kỹ năng mềm');
    return skill;
  }
}

export default new SoftSkillService();
