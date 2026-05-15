import ViolationReport from '../models/ViolationReport.js';

class ViolationReportRepository {
  create(data) {
    return ViolationReport.create(data);
  }

  findOne(filter) {
    return ViolationReport.findOne(filter);
  }

  findMany(filter = {}, options = {}) {
    const query = ViolationReport.find(filter);
    if (options.sort) query.sort(options.sort);
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return ViolationReport.countDocuments(filter);
  }

  findById(id) {
    return ViolationReport.findById(id);
  }

  updateById(id, data) {
    return ViolationReport.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }
}

export default new ViolationReportRepository();
