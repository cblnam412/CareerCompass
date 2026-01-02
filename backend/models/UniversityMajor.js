import mongoose from "mongoose";   
const universityMajorSchema = new mongoose.Schema({
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
    majorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Major',
        required: true,
    },
    majorName: {
        type: String,
        required: true,
    },
    tutionFee: {
        type: Number,
    },
    duration: {
        type: Number,
    },
    quota: {
        type: Number,
    },
    addmissionMethods: [{
        type: String,
    }],
}, {
    timestamps: true
});
const UniversityMajor = mongoose.model('UniversityMajor', universityMajorSchema);
export default UniversityMajor;