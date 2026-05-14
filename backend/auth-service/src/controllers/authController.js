import authService from '../services/authService.js';

const sendError = (res, error, fallbackMessage = 'Loi server') => {
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
                    message: 'Email va mat khau la bat buoc'
                });
            }

            const result = await authService.login(email, password);
            res.status(200).json({
                success: true,
                message: 'Dang nhap thanh cong',
                data: result
            });
        } catch (error) {
            sendError(res, error, 'Loi server khi dang nhap');
        }
    }

    async register(req, res) {
        try {
            const user = await authService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'Dang ki thanh cong',
                data: user
            });
        } catch (error) {
            sendError(res, error, 'Loi server khi dang ki');
        }
    }

    async registerUser(req, res) {
        try {
            const user = await authService.registerUser(req.body);
            res.status(201).json({
                success: true,
                message: 'Dang ki tai khoan thanh cong',
                data: user
            });
        } catch (error) {
            sendError(res, error, 'Loi server khi dang ki tai khoan');
        }
    }

    async registerUniversityRep(req, res) {
        try {
            const result = await authService.registerUniversityRep(req.body, req.files || {});
            res.status(201).json({
                success: true,
                message: 'Dang ki dai dien truong thanh cong. Vui long cho quan ly truong phe duyet',
                data: result
            });
        } catch (error) {
            sendError(res, error, 'Loi server khi dang ki dai dien truong');
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
                message: 'Cap nhat thong tin thanh cong',
                data: user
            });
        } catch (error) {
            sendError(res, error);
        }
    }

    async verifyToken(req, res) {
        res.status(200).json({
            success: true,
            message: 'Token hop le',
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
                message: 'Cap nhat profile thanh cong',
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
                    message: 'Vui long chon anh'
                });
            }

            const avatarFile = Array.isArray(req.files.avatar) ? req.files.avatar[0] : req.files.avatar;
            const user = await authService.uploadAvatar(req.userId, avatarFile);
            res.status(200).json({
                success: true,
                message: 'Cap nhat avatar thanh cong',
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
                message: 'Xoa avatar thanh cong'
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
