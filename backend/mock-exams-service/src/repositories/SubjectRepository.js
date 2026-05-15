import Subject from '../models/Subject.js';
import { escapeRegex } from '../utils/query.js';

class SubjectRepository {
  findById(id) {
    return Subject.findById(id);
  }

  findMany(filter = {}, projection = null, options = {}) {
    let query = Subject.find(filter, projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return Subject.countDocuments(filter);
  }

  findDuplicate({ name, code, excludeId }) {
    const duplicateFilters = [];
    if (name) duplicateFilters.push({ name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' } });
    if (code) duplicateFilters.push({ code: { $regex: `^${escapeRegex(code.trim())}$`, $options: 'i' } });
    if (duplicateFilters.length === 0) return null;

    const query = { $or: duplicateFilters };
    if (excludeId) query._id = { $ne: excludeId };
    return Subject.findOne(query);
  }

  create(data) {
    return Subject.create(data);
  }

  updateById(id, data) {
    return Subject.findByIdAndUpdate(id, { ...data, updatedAt: Date.now() }, { new: true, runValidators: true });
  }

  deleteById(id) {
    return Subject.findByIdAndDelete(id);
  }
}

export default new SubjectRepository();
