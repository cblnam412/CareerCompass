import mongoose from "mongoose";
const quizQuestionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalityQuiz',   
        required: true,
    },
    content: { 
        type: String,
        required: true,
    },
    order: {
        type: Number,
        required: true,
    },
    // MBTI: E/I, S/N, T/F, J/P
    // Holland: R, I, A, S, E, C
    dimension: {
        type: String,
        enum: ['E/I', 'S/N', 'T/F', 'J/P', null],
        default: null,
    },
    attribute: {
        type: String,
        enum: ['R', 'I', 'A', 'S', 'E', 'C', null],
        default: null,
    },
    agreePreference: {
        type: String,
        enum: ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P', null],
        default: null,
    },
    disagreePreference: {
        type: String,
        enum: ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P', null],
        default: null,
    },
}, {
    timestamps: true
});
const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
export default QuizQuestion;
