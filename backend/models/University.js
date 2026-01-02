import mongoose from "mongoose";
const universitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    address: {
        type: String,
    },
    website: {
        type: String,
    },
    region: {
        type: String,
    },
    phone: [{
        type: String,
    }],
}, {
    timestamps: true
});
const University = mongoose.model('University', universitySchema);
export default University;