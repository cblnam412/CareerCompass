import mongoose from "mongoose";

const modelVersionSchema = new mongoose.Schema({
    version: {
        type: Number,
        required: true,
        unique: true,
    },
    modelType: {
        type: String,
        enum: ['random_forest', 'decision_tree', 'ensemble', 'neural_network'],
        default: 'random_forest',
        required: true,
    },
    trainingConfig: {
        totalSamples: Number,
        trainTestSplit: Number,
        features: [String],
        hyperparameters: mongoose.Schema.Types.Mixed, // n_estimators, max_depth, etc.
    },
    performanceMetrics: {
        accuracy: Number,
        precision: Number,
        recall: Number,
        f1Score: Number,
        auc: Number,
        confusionMatrix: mongoose.Schema.Types.Mixed,
        classificationReport: mongoose.Schema.Types.Mixed,
    },
    modelPath: {
        type: String,
        required: true,
    },
    majorIdMap: {
        type: Map,
        of: Number,
        default: new Map()
    },
    reverseMajorIdMap: {
        type: Map,
        of: String,
        default: new Map()
    },
    trainingDate: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    trainingLogs: [String],
    notes: String,
    featureImportance: mongoose.Schema.Types.Mixed,
}, {
    timestamps: true
});

const ModelVersion = mongoose.model('ModelVersion', modelVersionSchema);
export default ModelVersion;
