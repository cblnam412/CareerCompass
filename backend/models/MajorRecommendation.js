import mongoose from "mongoose";
const majorRecommendationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    modelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AIModeConfig',
        required: true,
    },
    suggestions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Major',
    }],
    imputDataSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
}, {
    timestamps: true
});
const MajorRecommendation = mongoose.model('MajorRecommendation', majorRecommendationSchema);
export default MajorRecommendation;