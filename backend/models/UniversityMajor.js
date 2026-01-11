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
    admissionScore: {
        type: Number,
        description: 'Điểm chuẩn năm gần nhất từ vnexpress'
    },
    admissionScoreYear: {
        type: Number,
        description: 'Năm xét tuyển của điểm chuẩn'
    },
    addmissionMethods: [{
        type: String,
    }],
}, {
    timestamps: true
});
const UniversityMajor = mongoose.model('UniversityMajor', universityMajorSchema);
export default UniversityMajor;