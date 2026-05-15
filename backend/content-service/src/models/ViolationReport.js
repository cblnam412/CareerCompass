import mongoose from 'mongoose';

const violationReportSchema = new mongoose.Schema(
  {
    reporterId: { type: String, required: true, index: true },
    targetId: { type: String, required: true, alias: 'targerId', index: true },
    targetType: { type: String, enum: ['Post', 'Comment'], required: true, index: true },
    targetItemId: { type: String, required: true, index: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Resolved'],
      default: 'Pending',
      index: true,
    },
    decision: { type: String, enum: ['Approved', 'Rejected', null], default: null },
    actionTaken: { type: String, default: '' },
    resolvedBy: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

violationReportSchema.index(
  { reporterId: 1, targetItemId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'Pending' } },
);

export default mongoose.model('ViolationReport', violationReportSchema);
