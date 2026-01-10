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
    options: [{
        text: {
            type: String,
            required: true,
        },
        // MBTI: preference (E, I, S, N, T, F, J, P)
        preference: {
            type: String,
            enum: ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P', null],
            default: null,
        },
        score: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
    }],
}, {
    timestamps: true
});
const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
export default QuizQuestion;
