import MockExamAttempt from '../models/MockExamAttempt.js';

class MockExamAttemptRepository {
  findById(id) {
    return MockExamAttempt.findById(id);
  }

  findActive(studentId, mockExamId) {
    return MockExamAttempt.findOne({
      studentId,
      mockExamId,
      status: 'inProgress',
    }).sort({ startedAt: -1 });
  }

  create(data) {
    return MockExamAttempt.create(data);
  }

  updateById(id, data) {
    return MockExamAttempt.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }
}

export default new MockExamAttemptRepository();
