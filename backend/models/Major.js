import mongoose from 'mongoose';

const majorSchema = mongoose.Schema({
    universityCode: { type: String, required: true, index: true }, // FK: idTruong
    majorId: { type: String },                                     // idNganh
    majorCode: { type: String, required: true },                   // maNganh
    name: { type: String, required: true },                        // tenNganh
    subjectGroups: [{ type: String }],                             // toHopMon (dạng mảng)
    year: { type: Number },                                        // nam
    admissionScore: { type: Number, default: 0 },                  // diemchuan
    tuitionFee: { type: Number, default: 0 }                       // hocPhi
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Tạo quan hệ ảo để join với bảng University
majorSchema.virtual('university', {
    ref: 'University',
    localField: 'universityCode',
    foreignField: 'code',
    justOne: true
});

const Major = mongoose.model('Major', majorSchema);
export default Major;