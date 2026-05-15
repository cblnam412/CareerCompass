import MockExam from '../models/MockExam.js';

const populateSubject = (query) => query.populate('subject', '_id name code');

class MockExamRepository {
  findById(id) {
    return populateSubject(MockExam.findById(id));
  }

  findRawById(id) {
    return MockExam.findById(id);
  }

  findMany(filter = {}, projection = null, options = {}) {
    let query = MockExam.find(filter, projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return populateSubject(query);
  }

  count(filter = {}) {
    return MockExam.countDocuments(filter);
  }

  countBySubject(subjectId) {
    return MockExam.countDocuments({ subject: subjectId });
  }

  async create(data) {
    const exam = await MockExam.create(data);
    return this.findById(exam._id);
  }

  async updateById(id, data) {
    await MockExam.findByIdAndUpdate(id, { ...data, updatedAt: Date.now() }, { runValidators: true });
    return this.findById(id);
  }

  deleteById(id) {
    return MockExam.findByIdAndDelete(id);
  }

  async replaceQuestions(examId, questions) {
    await MockExam.findByIdAndUpdate(examId, { questions, updatedAt: Date.now() }, { runValidators: true });
    return this.findById(examId);
  }

  async appendQuestions(examId, questions) {
    await MockExam.findByIdAndUpdate(
      examId,
      {
        $push: { questions: { $each: questions } },
        $set: { updatedAt: Date.now() },
      },
      { runValidators: true },
    );
    return this.findById(examId);
  }
}

export default new MockExamRepository();
