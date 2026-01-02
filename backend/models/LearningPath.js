import mongoose  from "mongoose";
const learningPathSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetUniversityMajorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UniversityMajor',
        required: true,
    }, 
    currentScore: {
        type: Number,
        default: 0,
    }, 
    targerScore: {
        type: Number,
        required: true,
    },
    admissionProbability: {
        type: Number,
        default: 0,
    },
    riskLevel: {
        type: String,
        enum: ['safe', 'warning', 'danger'],
        default: 'safe',
    },
}, {
    timestamps: true
});
const LearningPath = mongoose.model('LearningPath', learningPathSchema);

export default LearningPath;