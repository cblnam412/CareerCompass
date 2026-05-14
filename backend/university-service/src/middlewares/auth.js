import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token xác thực',
    });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.userId = decoded.userId;
    req.email = decoded.email;
    req.role = decoded.role;
    next();
  } catch {
    res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

export const checkAdminRole = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền quản trị',
    });
  }
  next();
};

export const checkUniManagerRole = (req, res, next) => {
  if (!['admin', 'uniManager'].includes(req.role)) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền quản lý trường',
    });
  }
  next();
};

export const checkAdminOrUniManager = checkUniManagerRole;
