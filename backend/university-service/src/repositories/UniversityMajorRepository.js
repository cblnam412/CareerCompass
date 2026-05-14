import UniversityMajor from '../models/UniversityMajor.js';

class UniversityMajorRepository {
  findById(id) {
    return UniversityMajor.findById(id);
  }

  findByIdPopulated(id) {
    return UniversityMajor.findById(id).populate('majorId').populate('universityId');
  }

  findDuplicate(universityId, majorId) {
    return UniversityMajor.findOne({ universityId, majorId });
  }

  findMany(filter = {}, options = {}) {
    let query = UniversityMajor.find(filter);
    if (options.populate !== false) {
      query = query
        .populate('majorId', options.majorSelect || 'name category')
        .populate('universityId', options.universitySelect || 'name code region');
    }
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return UniversityMajor.countDocuments(filter);
  }

  create(data) {
    return UniversityMajor.create(data);
  }

  updateById(id, data, populate = true) {
    let query = UniversityMajor.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (populate) query = query.populate('majorId').populate('universityId');
    return query;
  }

  deleteById(id) {
    return UniversityMajor.findByIdAndDelete(id);
  }

  deleteAll() {
    return UniversityMajor.deleteMany({});
  }
}

export default new UniversityMajorRepository();
