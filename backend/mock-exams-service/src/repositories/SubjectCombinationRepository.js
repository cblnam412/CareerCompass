import SubjectCombination from '../models/SubjectCombination.js';
import { escapeRegex } from '../utils/query.js';

const populateSubjects = (query) => query.populate('subjects', '_id name code');

class SubjectCombinationRepository {
  findById(id) {
    return populateSubjects(SubjectCombination.findById(id));
  }

  findRawById(id) {
    return SubjectCombination.findById(id);
  }

  findMany(filter = {}, projection = null, options = {}) {
    let query = SubjectCombination.find(filter, projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return populateSubjects(query);
  }

  count(filter = {}) {
    return SubjectCombination.countDocuments(filter);
  }

  countBySubject(subjectId) {
    return SubjectCombination.countDocuments({ subjects: subjectId });
  }

  findDuplicate({ combinationName, excludeId }) {
    if (!combinationName) return null;

    const query = {
      combinationName: { $regex: `^${escapeRegex(combinationName.trim())}$`, $options: 'i' },
    };
    if (excludeId) query._id = { $ne: excludeId };
    return SubjectCombination.findOne(query);
  }

  async create(data) {
    const item = await SubjectCombination.create(data);
    return this.findById(item._id);
  }

  async updateById(id, data) {
    await SubjectCombination.findByIdAndUpdate(id, { ...data, updatedAt: Date.now() }, { runValidators: true });
    return this.findById(id);
  }

  deleteById(id) {
    return SubjectCombination.findByIdAndDelete(id);
  }
}

export default new SubjectCombinationRepository();
