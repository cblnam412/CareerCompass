import mongoose from "mongoose";
const personalityQuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, 
    },
    description: {
        type: String,
    },
    type: {
        type: String,
        enum: ['MBTI', 'Holland'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true
});
const PersonalityQuiz = mongoose.model('PersonalityQuiz', personalityQuizSchema);
export default PersonalityQuiz;