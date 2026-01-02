import mongoose from "mongoose";
import AdmissionScore from "./AdmissionScore";
const penaltyLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ViolationReport',
        required: true,
    },
    action: {
        type: String,
        enum: ['ISSUE_PENALTY', 'REVOKE_PENALTY', 'WARNING'],
        required: true,
    },
    duration: {
        type: Number, 
    }
}, {
    timestamps: true
});
const PenaltyLog = mongoose.model('PenaltyLog', penaltyLogSchema);
export default PenaltyLog;