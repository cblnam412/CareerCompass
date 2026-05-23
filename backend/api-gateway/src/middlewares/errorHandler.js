import { alertAbnormalError } from '../utils/monitoring.js';

/**
 * Error Handler Middleware
 * Xử lý tất cả các lỗi trong ứng dụng
 */
export const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Default error response
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (status >= 500) {
        alertAbnormalError({
            service: 'API Gateway',
            status,
            method: req.method,
            path: req.originalUrl || req.path,
            requestId: req.requestId,
            ip: req.ip,
            message,
            stack: err.stack,
        });
    }

    res.status(status).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? err : undefined,
        timestamp: new Date().toISOString()
    });
};

/**
 * Async Error Handler Wrapper
 * Wrap async route handlers để catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom Error Class
 */
export class APIError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
        this.name = 'APIError';
    }
}
