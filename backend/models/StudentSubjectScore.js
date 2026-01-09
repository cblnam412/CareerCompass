import mongoose from 'mongoose';

const studentSubjectScoreSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    examCount: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

studentSubjectScoreSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

const StudentSubjectScore = mongoose.model('StudentSubjectScore', studentSubjectScoreSchema);
export default StudentSubjectScore;
