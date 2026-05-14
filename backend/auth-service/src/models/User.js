import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Vui lòng nhập email hợp lệ']
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
        select: false
    },
    fullName: String,
    phone: String,
    DOB: Date,
    address: String,
    avatar: String,
    studentId: {
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['admin', 'uniManager', 'uniRep', 'student'],
        default: 'student'
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'banned'],
        default: 'active'
    },
    universityId: {
        type: String,
        required: function() {
            return this.role === 'uniManager' || this.role === 'uniRep';
        }
    },
    banReleaseDate: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return;
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        return error;
    }
});

// Phương thức so sánh mật khẩu
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
