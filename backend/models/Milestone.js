import mongoose from "mongoose";
const milestoneSchema = new mongoose.Schema({
    pathId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearningPath',
        required: true,
    }, 
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    type: {
        type: String,
        enum: ['course', 'activity', 'skill'],
        required: true,
    }, 
    targetScore: {
        type: Number,
    },
    deadline: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'overdue'],
        default: 'pending',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
}, {
    timestamps: true
});
const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;