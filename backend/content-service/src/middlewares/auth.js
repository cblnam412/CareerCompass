import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const readToken = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

const assignUser = (req, decoded) => {
  req.userId = decoded.userId;
  req.email = decoded.email;
  req.role = decoded.role;
  req.userRole = decoded.role;
};

export const verifyToken = (req, res, next) => {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token xác thực',
    });
  }

  try {
    assignUser(req, jwt.verify(token, env.jwtSecret));
    next();
  } catch {
    res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

export const optionalAuth = (req, res, next) => {
  const token = readToken(req);
  if (!token) return next();

  try {
    assignUser(req, jwt.verify(token, env.jwtSecret));
  } catch {
    // Public reads should still work when an optional token is stale.
  }

  next();
};

export const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.role || !roles.includes(req.role)) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập',
    });
  }
  next();
};

export const checkAdminRole = authorizeRole('admin');
