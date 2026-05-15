import QuizAttempt from '../models/QuizAttempt.js';

class QuizAttemptRepository {
  findById(id) {
    return QuizAttempt.findById(id).populate('quizId', 'title description type');
  }

  findByStudentId(studentId) {
    return QuizAttempt.find({ studentId })
      .populate('quizId', 'title type')
      .sort({ attemptedAt: -1 })
      .select('-rawAnswers');
  }

  findByQuizId(quizId) {
    return QuizAttempt.find({ quizId }).sort({ attemptedAt: -1 });
  }

  create(data) {
    return QuizAttempt.create(data);
  }
}

export default new QuizAttemptRepository();
