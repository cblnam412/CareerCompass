import mongoose from 'mongoose';

const majorMappingSchema = new mongoose.Schema({
    inputName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    displayName: {
        type: String,
        trim: true
    },
    mappedMajorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Major',
        required: true,
        index: true
    },
    mappedMajorName: String,
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
    },
    reason: String,
    matchedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const MajorMapping = mongoose.model('MajorMapping', majorMappingSchema);
export default MajorMapping;
