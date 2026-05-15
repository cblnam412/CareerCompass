import { isDevelopment } from '../config/env.js';

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route khong tim thay',
    path: req.originalUrl,
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Loi server',
    ...(err.details ? { errors: err.details } : {}),
    ...(isDevelopment && err.stack ? { error: err.stack } : {}),
  });
};
