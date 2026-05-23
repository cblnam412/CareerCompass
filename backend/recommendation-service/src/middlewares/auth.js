import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Khong tim thay token xac thuc',
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
      message: 'Token khong hop le hoac da het han',
    });
  }
};

export const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.role || !roles.includes(req.role)) {
    return res.status(403).json({
      success: false,
      message: 'Ban khong co quyen truy cap',
    });
  }
  next();
};

export const checkAdminRole = authorizeRole('admin');
