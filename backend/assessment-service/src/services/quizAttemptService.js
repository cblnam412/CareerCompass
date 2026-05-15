import { QuizAttemptRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';

class QuizAttemptService {
  async getAttemptResult(attemptId, requester = {}) {
    const attempt = await QuizAttemptRepository.findById(attemptId);
    if (!attempt) throw new HttpError(404, 'Khong tim thay ket qua lam bai');

    if (requester.role !== 'admin' && String(attempt.studentId) !== String(requester.userId)) {
      throw new HttpError(403, 'Ban khong co quyen xem ket qua nay');
    }

    return attempt;
  }

  async getMyAttempts(userId) {
    return QuizAttemptRepository.findByStudentId(userId);
  }
}

export default new QuizAttemptService();
