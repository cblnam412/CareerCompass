import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token không được cung cấp'
            });
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();

    } catch (error) {
        console.error('Verify token error:', error);
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn',
            error: error.message
        });
    }
};

export const checkAuth = (req, res, next) => {
    const userId = req.userId;
    
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Vui lòng đăng nhập trước'
        });
    }

    next();
};

export const checkUniManagerRole = async (req, res, next) => {
    try {
        const User = (await import('../models/User.js')).default;
        
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.role !== 'uniManager') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này. Chỉ quản lý trường (uniManager) mới có quyền'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('Check uniManager role error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền',
            error: error.message
        });
    }
};

export const checkAdminRole = async (req, res, next) => {
    try {
        const User = (await import('../models/User.js')).default;
        
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này. Chỉ admin mới có quyền'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('Check admin role error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền',
            error: error.message
        });
    }
};

export const checkRoles = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const User = (await import('../models/User.js')).default;
            
            const user = await User.findById(req.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Bạn không có quyền thực hiện hành động này. Yêu cầu role: ${allowedRoles.join(', ')}`
                });
            }

            req.user = user;
            next();

        } catch (error) {
            console.error('Check roles error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi kiểm tra quyền',
                error: error.message
            });
        }
    };
};
