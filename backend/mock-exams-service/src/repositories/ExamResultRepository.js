import ExamResult from '../models/ExamResult.js';

const populateResult = (query) =>
  query
    .populate('mockExamId', '_id title duration subject')
    .populate('subject', '_id name code');

class ExamResultRepository {
  findById(id) {
    return populateResult(ExamResult.findById(id));
  }

  findMany(filter = {}, projection = null, options = {}) {
    let query = ExamResult.find(filter, projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return populateResult(query);
  }

  count(filter = {}) {
    return ExamResult.countDocuments(filter);
  }

  async create(data) {
    const result = await ExamResult.create(data);
    return this.findById(result._id);
  }

  findByStudent(studentId, options = {}) {
    return this.findMany({ studentId }, null, options);
  }

  countByStudent(studentId) {
    return ExamResult.countDocuments({ studentId });
  }

  aggregateScoreBuckets() {
    return ExamResult.aggregate([
      {
        $bucket: {
          groupBy: '$scoreTotal',
          boundaries: [0, 2, 4, 6, 8, 10.01],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
      {
        $project: {
          _id: 0,
          point: '$_id',
          count: 1,
        },
      },
    ]);
  }
}

export default new ExamResultRepository();
