import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên trường đại học là bắt buộc'],
        unique: true
    },
    description: String,
    address: String,
    phone: String,
    email: String,
    website: String,
    logo: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const University = mongoose.model('University', universitySchema);

export default University;
