import mongoose from 'mongoose';

const universitySchema = mongoose.Schema({
    code: { type: String, required: true, unique: true }, // idTruong (khóa chính)
    shortName: { type: String },                          // shortName
    fullName: { type: String, required: true },           // fullName
    address: { type: String },
    phone1: { type: String },
    phone2: { type: String },
    website: { type: String },
    slug: { type: String },
    url: { type: String }
}, { timestamps: true });

const University = mongoose.model('University', universitySchema);
export default University;