import mongoose from "mongoose";
const ViolationReportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',   
        required: true,
    },
    targerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',   
        required: true,
    },
    targetType: {
        type: String,
        enum: ['Post', 'Comment', 'User'],
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved'],
        default: 'Pending',
    },
    proof: {
        type: String
    }
}, {
    timestamps: true
});
const ViolationReport = mongoose.model('ViolationReport', ViolationReportSchema);
export default ViolationReport;