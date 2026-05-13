import jwt from 'jsonwebtoken';

// Middleware kiểm tra JWT token
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token không được tìm thấy'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Token không hợp lệ hoặc đã hết hạn'
                });
            }

            req.userId = decoded.userId;
            req.email = decoded.email;
            req.role = decoded.role;
            next();
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực'
        });
    }
};

// Middleware kiểm tra vai trò
export const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.role || !roles.includes(req.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập'
            });
        }
        next();
    };
};

// Middleware xử lý lỗi
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi server'
    });
};
