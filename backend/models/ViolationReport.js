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
    targetItemId: {
        type: mongoose.Schema.Types.ObjectId,
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
    decision: {
        type: String,
        enum: ['Approved', 'Rejected'],
    },
    actionTaken: {
        type: String,
        description: 'Mô tả hành động đã thực hiện (xóa bài viết, ban tài khoản, etc)'
    },
    proof: {
        type: String
    }
}, {
    timestamps: true
});
const ViolationReport = mongoose.model('ViolationReport', ViolationReportSchema);
export default ViolationReport;