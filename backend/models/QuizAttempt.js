import mongoose from "mongoose";
const quizAttemptSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalityQuiz',
        required: true,
    },
    attemptedAt: {
        type: Date,
        default: Date.now,
    },
    rawAnswers: {
        type: [Number],
        required: true,
    },
    resultScore: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    interpretation: {
        type: mongoose.Schema.Types.Mixed,
    },
}, {
    timestamps: true
});
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;