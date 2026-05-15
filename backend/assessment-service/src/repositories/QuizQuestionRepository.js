import QuizQuestion from '../models/QuizQuestion.js';

class QuizQuestionRepository {
  findById(id) {
    return QuizQuestion.findById(id);
  }

  findByQuizId(quizId) {
    return QuizQuestion.find({ quizId }).sort({ order: 1 });
  }

  findOneByQuizAndId(quizId, questionId) {
    return QuizQuestion.findOne({ _id: questionId, quizId });
  }

  findLastByQuiz(quizId) {
    return QuizQuestion.findOne({ quizId }).sort({ order: -1 }).select('order');
  }

  create(data) {
    return QuizQuestion.create(data);
  }

  insertMany(items) {
    return QuizQuestion.insertMany(items, { ordered: false });
  }

  updateById(id, data) {
    return QuizQuestion.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  deleteOneByQuizAndId(quizId, questionId) {
    return QuizQuestion.findOneAndDelete({ _id: questionId, quizId });
  }

  deleteByQuizId(quizId) {
    return QuizQuestion.deleteMany({ quizId });
  }
}

export default new QuizQuestionRepository();
