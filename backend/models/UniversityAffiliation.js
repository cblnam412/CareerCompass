import mongoose from "mongoose";

const universityAffiliationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, 
    },
    studentIdNumber: {
        type: String,
        required: true,
        trim: true,
    },
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
    studentCardFront: {
        type: String,
        required: true,
    },
    studentCardBack: {
        type: String,
        required: true,
    },
    personalNote: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewNote: {
        type: String,
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    },
    reviewedAt: {
        type: Date,
    },
}, {
    timestamps: true
});

const UniversityAffiliation = mongoose.model('UniversityAffiliation', universityAffiliationSchema);
export default UniversityAffiliation;