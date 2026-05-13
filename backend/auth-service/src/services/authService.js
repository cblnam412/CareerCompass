import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import University from '../models/University.js';
import UniversityAffiliation from '../models/UniversityAffiliation.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { uploadFileToSupabase, deleteFileFromSupabase, ensureBucketExists } from '../utils/supabaseHelper.js';

class AuthService {
    // Đăng nhập
    async login(email, password) {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (!user) {
            throw {
                status: 401,
                message: 'Email hoặc mật khẩu không chính xác'
            };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw {
                status: 401,
                message: 'Email hoặc mật khẩu không chính xác'
            };
        }

        if (user.status === 'banned') {
            throw {
                status: 403,
                message: 'Tài khoản của bạn đã bị khóa'
            };
        }

        if (user.status === 'pending') {
            throw {
                status: 403,
                message: 'Tài khoản của bạn đang chờ phê duyệt'
            };
        }

        if (user.role === 'uniManager' || user.role === 'uniRep') {
            await user.populate('universityId', 'name description address');
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            token,
            user: userResponse
        };
    }

    // Đăng ký
    async register(userData) {
        const { email, password, firstName, lastName, role } = userData;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw {
                status: 400,
                message: 'Email đã được sử dụng'
            };
        }

        const user = new User({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            role: role || 'student',
            status: role === 'student' ? 'active' : 'pending'
        });

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        return userResponse;
    }

    // Xác minh token
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            throw {
                status: 401,
                message: 'Token không hợp lệ'
            };
        }
    }

    // Lấy thông tin user
    async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw {
                status: 404,
                message: 'Không tìm thấy người dùng'
            };
        }
        return user;
    }

    // Cập nhật thông tin user
    async updateUser(userId, updateData) {
        const { password, ...otherData } = updateData;
        
        const user = await User.findByIdAndUpdate(
            userId,
            { ...otherData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!user) {
            throw {
                status: 404,
                message: 'Không tìm thấy người dùng'
            };
        }

        return user;
    }

    // Đăng ký người dùng (sinh viên)
    async registerUser(userData) {
        const { fullName, email, password, DOB, address, studentId } = userData;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw {
                status: 400,
                message: 'Email đã được sử dụng'
            };
        }

        if (studentId) {
            const existingStudentId = await User.findOne({ studentId: studentId.trim() });
            if (existingStudentId) {
                throw {
                    status: 400,
                    message: 'Mã số sinh viên đã được sử dụng'
                };
            }
        }

        const newUser = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            password,
            DOB,
            address,
            studentId: studentId ? studentId.trim() : undefined,
            role: 'user',
            status: 'active'
        });

        const savedUser = await newUser.save();

        // Tạo student profile
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

        return userResponse;
    }

    // Đăng ký đại diện trường
    async registerUniversityRep(userData, files) {
        const {
            fullName,
            email,
            password,
            DOB,
            address,
            studentId,
            universityId,
            personalNote
        } = userData;

        if (!studentId) {
            throw {
                status: 400,
                message: 'Vui lòng nhập mã số sinh viên'
            };
        }

        if (!files || !files.studentCardFront || !files.studentCardBack) {
            throw {
                status: 400,
                message: 'Vui lòng upload ảnh mặt trước và mặt sau của thẻ sinh viên'
            };
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw {
                status: 400,
                message: 'Email đã được sử dụng'
            };
        }

        if (studentId) {
            const existingStudentId = await User.findOne({ studentId: studentId.trim() });
            if (existingStudentId) {
                throw {
                    status: 400,
                    message: 'Mã số sinh viên đã được sử dụng'
                };
            }
        }

        const university = await University.findById(universityId);
        if (!university) {
            throw {
                status: 404,
                message: 'Trường đại học không tồn tại'
            };
        }

        // Kiểm tra bucket tồn tại
        await ensureBucketExists('student-cards');

        // Upload ảnh mặt trước
        const frontCardUpload = await uploadFileToSupabase(
            files.studentCardFront[0],
            'student-cards',
            'front'
        );

        if (!frontCardUpload.success) {
            throw {
                status: 500,
                message: 'Lỗi upload ảnh mặt trước: ' + frontCardUpload.error
            };
        }

        // Upload ảnh mặt sau
        const backCardUpload = await uploadFileToSupabase(
            files.studentCardBack[0],
            'student-cards',
            'back'
        );

        if (!backCardUpload.success) {
            // Xóa ảnh mặt trước nếu upload mặt sau thất bại
            await deleteFileFromSupabase('student-cards', frontCardUpload.path);
            throw {
                status: 500,
                message: 'Lỗi upload ảnh mặt sau: ' + backCardUpload.error
            };
        }

        // Tạo user
        const newUser = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            password,
            DOB,
            address,
            studentId: studentId.trim(),
            role: 'uniRep',
            status: 'pending',
            universityId
        });

        const savedUser = await newUser.save();

        // Tạo affiliation
        const affiliation = new UniversityAffiliation({
            studentId: savedUser._id,
            studentIdNumber: studentId.trim(),
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

        return {
            user: userResponse,
            affiliation: savedAffiliation
        };
    }

    // Lấy profile user theo userId
    async getUserProfile(userId) {
        const user = await User.findById(userId)
            .populate('universityId', 'name code region address phone website description')
            .select('fullName DOB studentId avatar address role universityId createdAt');

        if (!user) {
            throw {
                status: 404,
                message: 'Người dùng không tồn tại'
            };
        }

        return user;
    }

    // Lấy profile user hiện tại
    async getMyProfile(userId) {
        const user = await User.findById(userId)
            .populate('universityId', 'name code region address phone website description')
            .select('-password');

        if (!user) {
            throw {
                status: 404,
                message: 'Người dùng không tồn tại'
            };
        }

        return user;
    }

    // Cập nhật profile user
    async updateMyProfile(userId, updateData) {
        const { fullName, DOB, address, studentId, password } = updateData;

        const user = await User.findById(userId);

        if (!user) {
            throw {
                status: 404,
                message: 'Người dùng không tồn tại'
            };
        }

        if (!['user', 'uniRep', 'uniManager'].includes(user.role)) {
            throw {
                status: 403,
                message: 'Không có quyền chỉnh sửa profile'
            };
        }

        if (fullName) user.fullName = fullName.trim();
        if (DOB) user.DOB = DOB;
        if (address) user.address = address.trim();
        if (studentId) user.studentId = studentId.trim();

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        user.updatedAt = Date.now();
        const updated = await user.save();

        const userResponse = updated.toObject();
        delete userResponse.password;

        return userResponse;
    }

    // Upload avatar
    async uploadAvatar(userId, file) {
        if (!file) {
            throw {
                status: 400,
                message: 'Vui lòng chọn ảnh'
            };
        }

        const user = await User.findById(userId);

        if (!user) {
            throw {
                status: 404,
                message: 'Người dùng không tồn tại'
            };
        }

        // Xóa avatar cũ nếu có
        if (user.avatar) {
            try {
                const fileKey = user.avatar.split('/').pop();
                await deleteFileFromSupabase('user-avatars', fileKey);
            } catch (error) {
                console.error('Error deleting old avatar:', error);
            }
        }

        // Upload avatar mới
        const avatarResult = await uploadFileToSupabase(
            file,
            'user-avatars',
            'avatars'
        );

        if (!avatarResult.success) {
            throw {
                status: 500,
                message: 'Lỗi upload avatar: ' + avatarResult.error
            };
        }

        user.avatar = avatarResult.url;
        user.updatedAt = Date.now();
        const updated = await user.save();

        const userResponse = updated.toObject();
        delete userResponse.password;

        return userResponse;
    }

    // Xóa avatar
    async deleteAvatar(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw {
                status: 404,
                message: 'Người dùng không tồn tại'
            };
        }

        if (user.avatar) {
            try {
                const fileKey = user.avatar.split('/').pop();
                await deleteFileFromSupabase('user-avatars', fileKey);
            } catch (error) {
                console.error('Error deleting avatar:', error);
            }

            user.avatar = null;
            user.updatedAt = Date.now();
            await user.save();
        }

        return { success: true };
    }
}

export default new AuthService();
