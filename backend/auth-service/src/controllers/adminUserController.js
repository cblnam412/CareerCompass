import adminUserService from '../services/adminUserService.js';

const sendError = (res, error, fallbackMessage = 'Loi server') => {
    const status = error.status || 500;
    res.status(status).json({
        success: false,
        message: error.message || fallbackMessage,
        error: error.message
    });
};

class AdminUserController {
    async listUsers(req, res) {
        try {
            const result = await adminUserService.listUsers(req.query);
            res.status(200).json({ success: true, message: 'Lay danh sach nguoi dung thanh cong', ...result });
        } catch (error) {
            sendError(res, error, 'Loi khi lay danh sach nguoi dung');
        }
    }

    async getUserById(req, res) {
        try {
            const data = await adminUserService.getUserById(req.params.id);
            res.status(200).json({ success: true, message: 'Lay nguoi dung thanh cong', data, user: data });
        } catch (error) {
            sendError(res, error, 'Loi khi lay nguoi dung');
        }
    }

    async createUser(req, res) {
        try {
            const data = await adminUserService.createUser(req.body);
            res.status(201).json({ success: true, message: 'Tao nguoi dung thanh cong', data, user: data });
        } catch (error) {
            sendError(res, error, 'Loi khi tao nguoi dung');
        }
    }

    async updateUser(req, res) {
        try {
            const data = await adminUserService.updateUser(req.params.id, req.body);
            res.status(200).json({ success: true, message: 'Cap nhat nguoi dung thanh cong', data, user: data });
        } catch (error) {
            sendError(res, error, 'Loi khi cap nhat nguoi dung');
        }
    }

    async unbanUser(req, res) {
        try {
            const data = await adminUserService.unbanUser(req.params.id);
            res.status(200).json({ success: true, message: 'Mo khoa nguoi dung thanh cong', data, user: data });
        } catch (error) {
            sendError(res, error, 'Loi khi mo khoa nguoi dung');
        }
    }

    async getInternalStats(req, res) {
        try {
            const data = await adminUserService.getInternalStats();
            res.status(200).json({ success: true, data });
        } catch (error) {
            sendError(res, error, 'Loi khi lay thong ke nguoi dung');
        }
    }
}

export default new AdminUserController();
