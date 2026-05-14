import Major from '../models/Major.js';
import { escapeRegex } from '../utils/query.js';

class MajorRepository {
  findById(id) {
    return Major.findById(id);
  }

  findByName(name, excludeId = undefined) {
    const query = { name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' } };
    if (excludeId) query._id = { $ne: excludeId };
    return Major.findOne(query);
  }

  findMany(filter = {}, options = {}) {
    let query = Major.find(filter);
    if (options.projection) query = query.select(options.projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return Major.countDocuments(filter);
  }

  distinct(field) {
    return Major.distinct(field);
  }

  aggregate(pipeline) {
    return Major.aggregate(pipeline);
  }

  create(data) {
    return Major.create(data);
  }

  insertMany(items) {
    return Major.insertMany(items);
  }

  deleteById(id) {
    return Major.findByIdAndDelete(id);
  }

  deleteManyByIds(ids) {
    return Major.deleteMany({ _id: { $in: ids } });
  }
}

export default new MajorRepository();
