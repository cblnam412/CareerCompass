import PersonalityQuiz from '../models/PersonalityQuiz.js';

class PersonalityQuizRepository {
  findById(id) {
    return PersonalityQuiz.findById(id);
  }

  findActiveByType(type) {
    return PersonalityQuiz.findOne({ type, isActive: true });
  }

  findMany(filter = {}, projection = null, options = {}) {
    let query = PersonalityQuiz.find(filter, projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return query;
  }

  count(filter = {}) {
    return PersonalityQuiz.countDocuments(filter);
  }

  create(data) {
    return PersonalityQuiz.create(data);
  }

  updateById(id, data) {
    return PersonalityQuiz.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteById(id) {
    return PersonalityQuiz.findByIdAndDelete(id);
  }
}

export default new PersonalityQuizRepository();
