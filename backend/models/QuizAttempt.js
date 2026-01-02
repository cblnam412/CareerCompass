import mongoose from "mongoose";
const quizAttemptSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
    },
    attemptedAt: {
        type: Date,
        default: Date.now,
    },
    rawAnswers: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    resultScore: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    imterpretation: {
        type: String,
    },
}, {
    timestamps: true
});
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;