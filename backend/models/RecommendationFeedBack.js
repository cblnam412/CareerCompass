import mongoose from "mongoose";
const recommendationFeedBackSchema = new mongoose.Schema({
    recommendationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MajorRecommendation',
        required: true,
    },
    majorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Major',
        required: true,
    },
    isHelpful: {
        type: Boolean,
        required: true,
    },
    userSelectionStatus: {
        type: String,
        enum: ['applied', 'accepted', 'enrolled', 'none'],
        default: 'none',
    },
    comments: {
        type: String,
    },
}, {
    timestamps: true
});
const RecommendationFeedBack = mongoose.model('RecommendationFeedBack', recommendationFeedBackSchema);
export default RecommendationFeedBack;