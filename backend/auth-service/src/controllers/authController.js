import authService from '../services/authService.js';

const sendError = (res, error, fallbackMessage = 'Lỗi server') => {
    const status = error.status || 500;
    res.status(status).json({
        success: false,
        message: error.message || fallbackMessage,
        error: error.message
    });
};

class AuthController {
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
            sendError(res, error, 'Lỗi server khi đăng nhập');
        }
    }

    async register(req, res) {
        try {
            const user = await authService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'Đăng ký thành công',
                data: user
            });
        } catch (error) {
            sendError(res, error, 'Lỗi server khi đăng ký');
        }
    }

    async registerUser(req, res) {
        try {
            const user = await authService.registerUser(req.body);
            res.status(201).json({
                success: true,
                message: 'Đăng ký tài khoản thành công',
                data: user
            });
        } catch (error) {
            sendError(res, error, 'Lỗi server khi đăng ký tài khoản');
        }
    }

    async registerUniversityRep(req, res) {
        try {
            const result = await authService.registerUniversityRep(req.body, req.files || {});
            res.status(201).json({
                success: true,
                message: 'Đăng ký đại diện trường thành công. Vui lòng chờ quản lý trường phê duyệt',
                data: result
            });
        } catch (error) {
            sendError(res, error, 'Lỗi server khi đăng ký đại diện trường');
        }
    }

    async getMe(req, res) {
        try {
            const user = await authService.getUserById(req.userId);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            sendError(res, error);
        }
    }

    async updateProfile(req, res) {
        try {
            const user = await authService.updateUser(req.userId, req.body);
            res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin thành công',
                data: user
            });
        } catch (error) {
            sendError(res, error);
        }
    }

    async verifyToken(req, res) {
        res.status(200).json({
            success: true,
            message: 'Token hợp lệ',
            data: {
                userId: req.userId,
                email: req.email,
                role: req.role
            }
        });
    }

    async getUserProfile(req, res) {
        try {
            const user = await authService.getUserProfile(req.params.userId);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            sendError(res, error);
        }
    }

    async getMyProfile(req, res) {
        try {
            const user = await authService.getMyProfile(req.userId);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            sendError(res, error);
        }
    }

    async updateMyProfile(req, res) {
        try {
            const user = await authService.updateMyProfile(req.userId, req.body);
            res.status(200).json({
                success: true,
                message: 'Cập nhật profile thành công',
                data: user
            });
        } catch (error) {
            sendError(res, error);
        }
    }

    async uploadAvatar(req, res) {
        try {
            if (!req.files || !req.files.avatar) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn ảnh'
                });
            }

            const avatarFile = Array.isArray(req.files.avatar) ? req.files.avatar[0] : req.files.avatar;
            const user = await authService.uploadAvatar(req.userId, avatarFile);
            res.status(200).json({
                success: true,
                message: 'Cập nhật avatar thành công',
                data: user
            });
        } catch (error) {
            sendError(res, error);
        }
    }

    async deleteAvatar(req, res) {
        try {
            await authService.deleteAvatar(req.userId);
            res.status(200).json({
                success: true,
                message: 'Xóa avatar thành công'
            });
        } catch (error) {
            sendError(res, error);
        }
    }

    async getInternalUser(req, res) {
        try {
            const user = await authService.getInternalUserById(req.params.userId);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            sendError(res, error);
        }
    }

    async getInternalUsersBatch(req, res) {
        try {
            const users = await authService.getInternalUsersByIds(req.body.userIds || []);
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            sendError(res, error);
        }
    }

    async updateInternalUserStatus(req, res) {
        try {
            const user = await authService.updateInternalUserStatus(req.params.userId, req.body);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            sendError(res, error);
        }
    }
}

export default new AuthController();
