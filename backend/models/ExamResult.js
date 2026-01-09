import mongoose from 'mongoose';

const examResultSchema = new mongoose.Schema({ 
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    mockExamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MockExam',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    scoreTotal: {
        type: Number,
        required: true,
    },
    scoreDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    takenAt: {
        type: Date,
        default: Date.now,
    },
    weaknesses: [{
        type: String,
    }],
    strengths: [{
        type: String,
    }],
    improvementTips: {
        type: String,
    }
}, {
    timestamps: true
});
const ExamResult = mongoose.model('ExamResult', examResultSchema);

export default ExamResult;