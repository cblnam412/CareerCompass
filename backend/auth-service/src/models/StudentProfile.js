import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    province: String,
    gpa: Number,
    currentGradeLevel: Number,
    academicTranscript: {
        type: Map,
        of: String,
        default: {}
    },
    mbtiResult: {
        type: Map,
        of: String,
        default: {}
    },
    hollandResult: {
        type: Map,
        of: String,
        default: {}
    },
    softSkills: [String],
    targetUniversityIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

export default StudentProfile;
