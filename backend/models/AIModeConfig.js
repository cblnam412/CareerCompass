import mongoose from "mongoose";
const AIModeConfigSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    modelType: {
        type: String,
        required: true,
        trim: true,
        default: "RF",
    },
    accuracy: {
        type: Number,
        required: true,
        default: 0.0,
    },
    featureWeights: {
        type: Map,
        of: Number,
        required: true,
        default: {},
    },
    trainedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: false,
    }
}, {
    timestamps: true
});
const AIModeConfig = mongoose.model('AIModeConfig', AIModeConfigSchema);
export default AIModeConfig;