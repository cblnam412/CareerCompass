import UniversityAffiliation from '../models/UniversityAffiliation.js';

const populateList = (query) =>
  query
    .populate('studentId', 'fullName email DOB studentId address avatar status')
    .populate('universityId', 'name code')
    .populate('reviewerId', 'fullName email')
    .populate('reviewedBy', 'fullName email');

class UniversityAffiliationRepository {
  findById(id, populated = false) {
    const query = UniversityAffiliation.findById(id);
    return populated ? populateList(query) : query;
  }

  findMany(filter = {}, options = {}) {
    let query = UniversityAffiliation.find(filter);
    query = populateList(query);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return UniversityAffiliation.countDocuments(filter);
  }

  updateById(id, data) {
    return populateList(UniversityAffiliation.findByIdAndUpdate(id, data, { new: true, runValidators: true }));
  }
}

export default new UniversityAffiliationRepository();
