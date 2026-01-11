import User from '../models/User.js';
import University from '../models/University.js';
import StudentProfile from '../models/StudentProfile.js';
import UniversityAffiliation from '../models/UniversityAffiliation.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { uploadFileToSupabase, deleteFileFromSupabase, ensureBucketExists } from '../utils/supabaseUtils.js';

export const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, DOB, address, studentId } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email đã được sử dụng' 
            });
        }

        if (studentId) {
            const existingStudentId = await User.findOne({ studentId: studentId.trim() });
            if (existingStudentId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã số sinh viên đã được sử dụng' 
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            DOB,
            address,
            studentId: studentId ? studentId.trim() : undefined,
            role: 'user',
            status: 'active'
        });

        const savedUser = await newUser.save();

        const studentProfile = new StudentProfile({
            userId: savedUser._id,
            province: '',
            gpa: null,
            currentGradeLevel: null,
            academicTranscript: {},
            mbtiResult: {},
            hollandResult: {},
            softSkills: [],
            targetUniversityIds: []
        });

        await studentProfile.save();

        const userResponse = savedUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công',
            data: userResponse
        });

    } catch (error) {
        console.error('Register user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký tài khoản',
            error: error.message
        });
    }
};

export const registerUniversityRep = async (req, res) => {
    try {
        const { 
            fullName, 
            email, 
            password, 
            DOB, 
            address, 
            studentId,
            universityId,
            personalNote,
            studentID
        } = req.body;

        if (!req.files || !req.files.studentCardFront || !req.files.studentCardBack) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng upload ảnh mặt trước và mặt sau của thẻ sinh viên' 
            });
        }

        if (!studentID)
        {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng nhập mã số sinh viên' 
            });
        }
        
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email đã được sử dụng' 
            });
        }
        
        if (studentId) {
            const existingStudentId = await User.findOne({ studentId: studentId.trim() });
            if (existingStudentId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã số sinh viên đã được sử dụng' 
                });
            }
        }

        const university = await University.findById(universityId);
        if (!university) {
            return res.status(404).json({ 
                success: false, 
                message: 'Trường đại học không tồn tại' 
            });
        }

        await ensureBucketExists('student-cards');

        const frontCardUpload = await uploadFileToSupabase(
            req.files.studentCardFront[0],
            'student-cards',
            'front'
        );

        if (!frontCardUpload.success) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi upload ảnh mặt trước: ' + frontCardUpload.error
            });
        }

        const backCardUpload = await uploadFileToSupabase(
            req.files.studentCardBack[0],
            'student-cards',
            'back'
        );

        if (!backCardUpload.success) {
            await deleteFileFromSupabase('student-cards', frontCardUpload.path);
            return res.status(500).json({
                success: false,
                message: 'Lỗi upload ảnh mặt sau: ' + backCardUpload.error
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            DOB,
            address,
            studentId: studentId ? studentId.trim() : null,
            role: 'uniRep',
            status: 'pending', 
            universityId
        });

        const savedUser = await newUser.save();

        const affiliation = new UniversityAffiliation({
            studentId: savedUser._id,
            studentIdNumber: studentID.trim(),
            universityId,
            studentCardFront: frontCardUpload.url,
            studentCardBack: backCardUpload.url,
            personalNote,
            status: 'pending', 
            appliedAt: new Date()
        });

        const savedAffiliation = await affiliation.save();

        const userResponse = savedUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Đăng ký đại diện trường thành công. Vui lòng chờ quản lý trường phê duyệt',
            data: {
                user: userResponse,
                affiliation: savedAffiliation
            }
        });

    } catch (error) {
        console.error('Register uni rep error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký đại diện trường',
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        if (user.status === 'banned') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn đã bị khóa'
            });
        }

        if (user.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn đang chờ phê duyệt'
            });
        }

        if (user.role === "uniManager" || user.role === "uniRep")
        {
            await user.populate('universityId', 'name description address')
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập',
            error: error.message
        });
    }
};
