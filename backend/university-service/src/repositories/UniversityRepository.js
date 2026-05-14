import University from '../models/University.js';
import { escapeRegex } from '../utils/query.js';

class UniversityRepository {
  findById(id) {
    return University.findById(id);
  }

  findMany(filter = {}, projection = null, options = {}) {
    let query = University.find(filter, projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return University.countDocuments(filter);
  }

  findDuplicate({ name, code, excludeId }) {
    const duplicateFilters = [];
    if (name) duplicateFilters.push({ name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' } });
    if (code) duplicateFilters.push({ code: { $regex: `^${escapeRegex(code.trim())}$`, $options: 'i' } });
    if (duplicateFilters.length === 0) return null;

    const query = { $or: duplicateFilters };
    if (excludeId) query._id = { $ne: excludeId };
    return University.findOne(query);
  }

  findCodes(codes) {
    return University.find({ code: { $in: codes } }).select('code');
  }

  create(data) {
    return University.create(data);
  }

  insertMany(items) {
    return University.insertMany(items);
  }

  deleteById(id) {
    return University.findByIdAndDelete(id);
  }
}

export default new UniversityRepository();
