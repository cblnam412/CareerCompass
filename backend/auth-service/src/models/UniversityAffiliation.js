import mongoose from 'mongoose';

const universityAffiliationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentIdNumber: {
        type: String,
        required: true
    },
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    studentCardFront: {
        type: String,
        required: true
    },
    studentCardBack: {
        type: String,
        required: true
    },
    personalNote: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: Date,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const UniversityAffiliation = mongoose.model('UniversityAffiliation', universityAffiliationSchema);

export default UniversityAffiliation;
