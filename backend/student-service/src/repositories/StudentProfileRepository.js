import StudentProfile from '../models/StudentProfile.js';

class StudentProfileRepository {
  findByUserId(userId) {
    return StudentProfile.findOne({ userId });
  }

  create(data) {
    return StudentProfile.create(data);
  }

  updateByUserId(userId, data, options = {}) {
    return StudentProfile.findOneAndUpdate(
      { userId },
      data,
      { new: true, runValidators: true, ...options },
    );
  }
}

export default new StudentProfileRepository();
