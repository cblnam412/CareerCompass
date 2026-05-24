import adminUserService from '../services/adminUserService.js';

const sendError = (res, error, fallbackMessage = 'Lỗi server') => {
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
            res.status(200).json({ success: true, message: 'Lấy danh sách người dùng thành công', ...result });
        } catch (error) {
            sendError(res, error, 'Lỗi khi lấy danh sách người dùng');
        }
    }

    async getUserById(req, res) {
        try {
            const data = await adminUserService.getUserById(req.params.id);
            res.status(200).json({ success: true, message: 'Lấy người dùng thành công', data, user: data });
        } catch (error) {
            sendError(res, error, 'Lỗi khi lấy người dùng');
        }
    }

    async createUser(req, res) {
        try {
            const data = await adminUserService.createUser(req.body);
            res.status(201).json({ success: true, message: 'Tạo người dùng thành công', data, user: data });
        } catch (error) {
            sendError(res, error, 'Lỗi khi tạo người dùng');
        }
    }

    async updateUser(req, res) {
        try {
            const data = await adminUserService.updateUser(req.params.id, req.body);
            res.status(200).json({ success: true, message: 'Cập nhật người dùng thành công', data, user: data });
        } catch (error) {
            sendError(res, error, 'Lỗi khi cập nhật người dùng');
        }
    }

    async unbanUser(req, res) {
        try {
            const data = await adminUserService.unbanUser(req.params.id);
            res.status(200).json({ success: true, message: 'Mở khóa người dùng thành công', data, user: data });
        } catch (error) {
            sendError(res, error, 'Lỗi khi mở khóa người dùng');
        }
    }

    async getInternalStats(req, res) {
        try {
            const data = await adminUserService.getInternalStats();
            res.status(200).json({ success: true, data });
        } catch (error) {
            sendError(res, error, 'Lỗi khi lấy thống kê người dùng');
        }
    }
}

export default new AdminUserController();
