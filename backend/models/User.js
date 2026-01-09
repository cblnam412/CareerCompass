import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'uniRep', 'uniManager'],
        default: 'user'
    },
    DOB: {
        type: Date,
    },
    studentId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    address: {
        type: String,
    },
    avatar: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'banned'],
        default: 'active'
    },
    banReleaseDate: {
        type: Date,
    },
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;