import UniversityAffiliation from '../models/UniversityAffiliation.js';

const populateList = (query) =>
  query
    .populate('universityId', 'name code');

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

  async create(data) {
    const affiliation = await UniversityAffiliation.create(data);
    return populateList(UniversityAffiliation.findById(affiliation._id));
  }

  updateById(id, data) {
    return populateList(UniversityAffiliation.findByIdAndUpdate(id, data, { new: true, runValidators: true }));
  }
}

export default new UniversityAffiliationRepository();
