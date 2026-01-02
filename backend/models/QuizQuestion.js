import mongoose from "mongoose";
const quizQuestionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',   
        required: true,
    },
    content: { 
        type: String,
        required: true,
    },
    options: [{
        type: mongoose.Schema.Types.Mixed,
        required: true,
    }],
}, {
    timestamps: true
});
const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
export default QuizQuestion;
