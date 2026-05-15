import SoftSkill from '../models/SoftSkill.js';
import { escapeRegex } from '../utils/query.js';

class SoftSkillRepository {
  findById(id) {
    return SoftSkill.findById(id);
  }

  findMany(filter = {}, projection = null, options = {}) {
    let query = SoftSkill.find(filter, projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return SoftSkill.countDocuments(filter);
  }

  findDuplicate(name, excludeId) {
    const query = {
      softSkillName: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' },
    };
    if (excludeId) query._id = { $ne: excludeId };
    return SoftSkill.findOne(query);
  }

  create(data) {
    return SoftSkill.create(data);
  }

  updateById(id, data) {
    return SoftSkill.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteById(id) {
    return SoftSkill.findByIdAndDelete(id);
  }
}

export default new SoftSkillRepository();
