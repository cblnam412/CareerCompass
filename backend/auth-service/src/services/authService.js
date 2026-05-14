import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
    UserRepository,
    StudentProfileRepository,
    UniversityRepository,
    UniversityAffiliationRepository,
    FileRepository
} from '../repositories/index.js';

class AuthService {
    async checkBirthday(DOB) {
        const today = new Date();
        const birthDate = new Date(DOB);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();  
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (isNaN(age) || age < 15) {
            throw {
                status: 400,
                message: 'Ngày sinh không hợp lệ hoặc bạn phải trên 15 tuổi'
            };
        }
    }
    // Đăng nhập
    async login(email, password) {
        const user = await UserRepository.findByEmailWithPassword(email);
        
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

        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
            throw {
                status: 400,
                message: 'Email đã được sử dụng'
            };
        }

        const user = await UserRepository.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            role: role || 'student',
            status: role === 'student' ? 'active' : 'pending'
        });

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
        const user = await UserRepository.findById(userId);
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
        const user = await UserRepository.update(userId, updateData);

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

        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
            throw {
                status: 400,
                message: 'Email đã được sử dụng'
            };
        }

        if (studentId) {
            const existingStudentId = await UserRepository.findByStudentId(studentId);
            if (existingStudentId) {
                throw {
                    status: 400,
                    message: 'Mã số sinh viên đã được sử dụng'
                };
            }
        }
        console.log('hello');
        await this.checkBirthday(DOB);
        console.log('Birthday check passed for DOB:', DOB);

        const newUser = await UserRepository.create({
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            password,
            DOB,
            address,
            studentId: studentId ? studentId.trim() : undefined,
            role: 'student',
            status: 'active'
        });
        console.log('New user created:', newUser);
        // Tạo student profile
        await StudentProfileRepository.create({
            userId: newUser._id,
            province: '',
            gpa: null,
            currentGradeLevel: null,
            academicTranscript: {},
            mbtiResult: {},
            hollandResult: {},
            softSkills: [],
            targetUniversityIds: []
        });

        const userResponse = newUser.toObject();
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

        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
            throw {
                status: 400,
                message: 'Email đã được sử dụng'
            };
        }

        if (studentId) {
            const existingStudentId = await UserRepository.findByStudentId(studentId);
            if (existingStudentId) {
                throw {
                    status: 400,
                    message: 'Mã số sinh viên đã được sử dụng'
                };
            }
        }

        const university = await UniversityRepository.findById(universityId);
        if (!university) {
            throw {
                status: 404,
                message: 'Trường đại học không tồn tại'
            };
        }

        // Kiểm tra bucket tồn tại
        await FileRepository.ensureBucketExists('student-cards');

        // Upload ảnh mặt trước
        const frontCardUpload = await FileRepository.uploadStudentCard(
            files.studentCardFront[0],
            'front'
        );

        if (!frontCardUpload.success) {
            throw {
                status: 500,
                message: 'Lỗi upload ảnh mặt trước: ' + frontCardUpload.error
            };
        }

        // Upload ảnh mặt sau
        const backCardUpload = await FileRepository.uploadStudentCard(
            files.studentCardBack[0],
            'back'
        );

        if (!backCardUpload.success) {
            // Xóa ảnh mặt trước nếu upload mặt sau thất bại
            await FileRepository.deleteStudentCard(frontCardUpload.path);
            throw {
                status: 500,
                message: 'Lỗi upload ảnh mặt sau: ' + backCardUpload.error
            };
        }

        // Tạo user
        const newUser = await UserRepository.create({
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

        // Tạo affiliation
        const affiliation = await UniversityAffiliationRepository.create({
            studentId: newUser._id,
            studentIdNumber: studentId.trim(),
            universityId,
            studentCardFront: frontCardUpload.url,
            studentCardBack: backCardUpload.url,
            personalNote,
            status: 'pending',
            appliedAt: new Date()
        });

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return {
            user: userResponse,
            affiliation: affiliation
        };
    }

    // Lấy profile user theo userId
    async getUserProfile(userId) {
        const user = await UserRepository.findByIdSelectFields(
            userId,
            'fullName DOB studentId avatar address role universityId createdAt'
        );

        if (!user) {
            throw {
                status: 404,
                message: 'Người dùng không tồn tại'
            };
        }

        // Populate university info
        await user.populate('universityId', 'name code region address phone website description');

        return user;
    }

    // Lấy profile user hiện tại
    async getMyProfile(userId) {
        const user = await UserRepository.findByIdWithPopulatedUniversity(userId);

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

        const user = await UserRepository.findById(userId);

        if (!user) {
            throw {
                status: 404,
                message: 'Người dùng không tồn tại'
            };
        }

        if (!['student', 'uniRep', 'uniManager'].includes(user.role)) {
            throw {
                status: 403,
                message: 'Không có quyền chỉnh sửa profile'
            };
        }

        const updatePayload = {};
        if (fullName) updatePayload.fullName = fullName.trim();
        if (DOB) updatePayload.DOB = DOB;
        if (address) updatePayload.address = address.trim();
        if (studentId) updatePayload.studentId = studentId.trim();
        if (password) updatePayload.password = password;

        const updated = await UserRepository.update(userId, updatePayload);

        const userResponse = updated.toObject();
        delete userResponse.password;

        return userResponse;
    }

    // Upload avatar
    async uploadAvatar(userId, file) {
        if (!file) {
            throw { status: 400, message: 'Vui lòng chọn ảnh' };
        }

        const user = await UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: 'Người dùng không tồn tại' };
        }

        // Đảm bảo bucket 'user-avatars' tồn tại
        const bucketCheck = await FileRepository.ensureBucketExists('user-avatars');
        if (!bucketCheck.success) {
            throw { status: 500, message: 'Lỗi kiểm tra bucket: ' + bucketCheck.error };
        }

        // Xóa avatar cũ nếu có
        if (user.avatar) {
            try {
                const fileKey = FileRepository.extractFileNameFromUrl(user.avatar);
                await FileRepository.deleteAvatar(fileKey);
            } catch (error) {
                console.error('Error deleting old avatar:', error);
            }
        }

        // Upload avatar mới
        const avatarResult = await FileRepository.uploadAvatar(file);
        if (!avatarResult.success) {
            throw { status: 500, message: 'Lỗi upload avatar: ' + avatarResult.error };
        }

        const updated = await UserRepository.updateAvatar(userId, avatarResult.url);

        const userResponse = updated.toObject();
        delete userResponse.password;
        return userResponse;
    }

    // Xóa avatar
    async deleteAvatar(userId) {
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw {
                status: 404,
                message: 'Người dùng không tồn tại'
            };
        }

        if (user.avatar) {
            try {
                const fileKey = FileRepository.extractFileNameFromUrl(user.avatar);
                await FileRepository.deleteAvatar(fileKey);
            } catch (error) {
                console.error('Error deleting avatar:', error);
            }

            await UserRepository.deleteAvatar(userId);
        }

        return { success: true };
    }
}

export default new AuthService();
