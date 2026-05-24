import { QuizAttemptRepository } from '../repositories/index.js';
import { HttpError } from '../utils/httpError.js';

class QuizAttemptService {
  async getAttemptResult(attemptId, requester = {}) {
    const attempt = await QuizAttemptRepository.findById(attemptId);
    if (!attempt) throw new HttpError(404, 'Không tìm thấy kết quả làm bài');

    if (requester.role !== 'admin' && String(attempt.studentId) !== String(requester.userId)) {
      throw new HttpError(403, 'Bạn không có quyền xem kết quả này');
    }

    return attempt;
  }

  async getMyAttempts(userId) {
    return QuizAttemptRepository.findByStudentId(userId);
  }
}

export default new QuizAttemptService();
