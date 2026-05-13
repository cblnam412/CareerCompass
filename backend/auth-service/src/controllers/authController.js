import authService from '../services/authService.js';

class AuthController {
    // Đăng nhập
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email và mật khẩu là bắt buộc'
                });
            }

            const result = await authService.login(email, password);

            res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công',
                data: result
            });
        } catch (error) {
            console.error('Login error:', error);
            const status = error.status || 500;
            const message = error.message || 'Lỗi server khi đăng nhập';
            
            res.status(status).json({
                success: false,
                message,
                error: error.message
            });
        }
    }

    // Đăng ký
    async register(req, res) {
        try {
            const { email, password, firstName, lastName, role } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email và mật khẩu là bắt buộc'
                });
            }

            const user = await authService.register({
                email,
                password,
                firstName,
                lastName,
                role
            });

            res.status(201).json({
                success: true,
                message: 'Đăng ký thành công',
                data: user
            });
        } catch (error) {
            console.error('Register error:', error);
            const status = error.status || 500;
            const message = error.message || 'Lỗi server khi đăng ký';

            res.status(status).json({
                success: false,
                message,
                error: error.message
            });
        }
    }

    // Đăng ký người dùng (sinh viên)
    async registerUser(req, res) {
        try {
            const { fullName, email, password, DOB, address, studentId } = req.body;

            if (!fullName || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên, email và mật khẩu là bắt buộc'
                });
            }

            const user = await authService.registerUser({
                fullName,
                email,
                password,
                DOB,
                address,
                studentId
            });

            res.status(201).json({
                success: true,
                message: 'Đăng ký tài khoản thành công',
                data: user
            });
        } catch (error) {
            console.error('Register user error:', error);
            const status = error.status || 500;
            const message = error.message || 'Lỗi server khi đăng ký tài khoản';

            res.status(status).json({
                success: false,
                message,
                error: error.message
            });
        }
    }

    // Đăng ký đại diện trường
    async registerUniversityRep(req, res) {
        try {
            const { fullName, email, password, DOB, address, studentId, universityId, personalNote } = req.body;

            if (!fullName || !email || !password || !studentId || !universityId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên, email, mật khẩu, mã sinh viên và ID trường đại học là bắt buộc'
                });
            }

            if (!req.files || !req.files.studentCardFront || !req.files.studentCardBack) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng upload ảnh mặt trước và mặt sau của thẻ sinh viên'
                });
            }

            const result = await authService.registerUniversityRep(
                {
                    fullName,
                    email,
                    password,
                    DOB,
                    address,
                    studentId,
                    universityId,
                    personalNote
                },
                req.files
            );

            res.status(201).json({
                success: true,
                message: 'Đăng ký đại diện trường thành công. Vui lòng chờ quản lý trường phê duyệt',
                data: result
            });
        } catch (error) {
            console.error('Register uni rep error:', error);
            const status = error.status || 500;
            const message = error.message || 'Lỗi server khi đăng ký đại diện trường';

            res.status(status).json({
                success: false,
                message,
                error: error.message
            });
        }
    }

    // Lấy thông tin user hiện tại
    async getMe(req, res) {
        try {
            const user = await authService.getUserById(req.userId);

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('GetMe error:', error);
            const status = error.status || 500;
            
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    // Cập nhật thông tin user
    async updateProfile(req, res) {
        try {
            const user = await authService.updateUser(req.userId, req.body);

            res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin thành công',
                data: user
            });
        } catch (error) {
            console.error('Update profile error:', error);
            const status = error.status || 500;
            
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    // Kiểm tra token
    async verifyToken(req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Token hợp lệ',
                data: {
                    userId: req.userId,
                    email: req.email,
                    role: req.role
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }
    }

    // Lấy profile user theo userId
    async getUserProfile(req, res) {
        try {
            const { userId } = req.params;

            const user = await authService.getUserProfile(userId);

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Get user profile error:', error);
            const status = error.status || 500;

            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    // Lấy profile user hiện tại
    async getMyProfile(req, res) {
        try {
            const user = await authService.getMyProfile(req.userId);

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Get profile error:', error);
            const status = error.status || 500;

            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    // Cập nhật profile
    async updateMyProfile(req, res) {
        try {
            const { fullName, DOB, address, studentId, password } = req.body;

            const user = await authService.updateMyProfile(req.userId, {
                fullName,
                DOB,
                address,
                studentId,
                password
            });

            res.status(200).json({
                success: true,
                message: 'Cập nhật profile thành công',
                data: user
            });
        } catch (error) {
            console.error('Update profile error:', error);
            const status = error.status || 500;

            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    // Upload avatar
    async uploadAvatar(req, res) {
        try {
            if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn ảnh'
                });
            }

            const user = await authService.uploadAvatar(req.userId, req.files.avatar[0]);

            res.status(200).json({
                success: true,
                message: 'Cập nhật avatar thành công',
                data: user
            });
        } catch (error) {
            console.error('Upload avatar error:', error);
            const status = error.status || 500;

            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    // Xóa avatar
    async deleteAvatar(req, res) {
        try {
            await authService.deleteAvatar(req.userId);

            res.status(200).json({
                success: true,
                message: 'Xóa avatar thành công'
            });
        } catch (error) {
            console.error('Delete avatar error:', error);
            const status = error.status || 500;

            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new AuthController();
