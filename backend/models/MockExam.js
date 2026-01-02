import mongoose from 'mongoose';
const mockExamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true    
    },
    subjectCombination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubjectCombination',
        required: true
    },
    duration: {
        type: Number,
        required: true
    }, 
    questions: [{
        type: mongoose.Schema.Types.Mixed,
        required: true
    }],
}, {
    timestamps: true
});
const MockExam = mongoose.model('MockExam', mockExamSchema);
export default MockExam;