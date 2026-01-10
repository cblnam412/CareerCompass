import mongoose from "mongoose";


const studentProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
    },
    province: {
        type: String,
    },
    academicTranscript: [{
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
        },
        score: {
            type: Number,
            min: 0,
            max: 10,
        }
    }], 
    gpa: {
        type: Number,
        min: 0,
        max: 10,
    },
    mbtiResult: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    hollandResult: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    softSkills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SoftSkill',
    }],
    currentGradeLevel: {
        type: Number,
    },
    targetUniversityIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
    }],
}, {
    timestamps: true
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;
    