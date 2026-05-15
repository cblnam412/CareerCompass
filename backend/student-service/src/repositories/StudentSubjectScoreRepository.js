import StudentSubjectScore from '../models/StudentSubjectScore.js';

class StudentSubjectScoreRepository {
  findByStudent(studentId) {
    return StudentSubjectScore.find({ studentId }).lean();
  }

  findOne(studentId, subjectId) {
    return StudentSubjectScore.findOne({ studentId, subjectId });
  }

  findOneLean(studentId, subjectId) {
    return StudentSubjectScore.findOne({ studentId, subjectId }).lean();
  }

  upsert(studentId, subjectId, data) {
    return StudentSubjectScore.findOneAndUpdate(
      { studentId, subjectId },
      data,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }

  deleteOne(studentId, subjectId) {
    return StudentSubjectScore.findOneAndDelete({ studentId, subjectId });
  }
}

export default new StudentSubjectScoreRepository();
