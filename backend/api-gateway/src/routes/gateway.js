import express from 'express';
import proxy from 'express-http-proxy';
import { getService, getAllServices } from '../config/services.js';
import { APIError, asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

/**
 * Gateway routes - Điều hướng requests tới các services
 */

// ==================== Gateway Info ====================
/**
 * GET /api/gateway/info
 * Lấy thông tin về gateway và các services
 */
router.get('/gateway/info', asyncHandler((req, res) => {
    const services = getAllServices();
    const servicesList = Object.entries(services).map(([key, service]) => ({
        key: key,
        name: service.name,
        prefix: service.prefix,
        url: service.url,
        timeout: service.timeout,
        status: 'active'
    }));

    res.status(200).json({
        success: true,
        message: 'API Gateway Information',
        gateway: {
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        },
        services: servicesList
    });
}));

/**
 * GET /api/gateway/services
 * Liệt kê tất cả services
 */
router.get('/gateway/services', asyncHandler((req, res) => {
    const services = getAllServices();
    res.status(200).json({
        success: true,
        services: Object.keys(services),
        count: Object.keys(services).length,
        timestamp: new Date().toISOString()
    });
}));

// ==================== Dynamic Routing ====================
/**
 * Proxy middleware factory
 * Tạo proxy middleware cho từng service
 */
const createProxyMiddleware = (service) => {
    return proxy(service.url, {
        // Transform request path
        proxyReqPathResolver: (req) => {
            const path = req.url.replace(service.prefix, '');
            return service.targetPrefix ? `${service.targetPrefix}${path}` : path;
        },

        // Transform request
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            // Thêm custom headers
            proxyReqOpts.headers = {
                ...proxyReqOpts.headers,
                'x-forwarded-by': 'api-gateway',
                'x-original-url': srcReq.originalUrl,
                'x-original-method': srcReq.method,
                'x-request-id': generateRequestId(),
                'x-forwarded-proto': srcReq.protocol,
                'x-forwarded-host': srcReq.get('host'),
                'x-real-ip': srcReq.ip
            };

            // Log request
            console.log(`📤 Forwarding ${srcReq.method} ${service.prefix}${proxyReqOpts.path} to ${service.url}`);

            return proxyReqOpts;
        },

        // Handle error
        onError: (err, req, res) => {
            console.error(`❌ Error from ${service.name}:`, err.message);
            
            res.status(503).json({
                success: false,
                message: `Service "${service.name}" không khả dụng`,
                error: err.message,
                service: service.name
            });
        },

        // Handle timeout
        timeout: service.timeout,

        // Limit response size
        limit: '100mb'
    });
};

/**
 * Auth Service Routes
 * /api/auth/*
 */
const authService = getService('/auth');
if (authService) {
    router.use('/auth', createProxyMiddleware(authService));
}

const universityService = getService('/universities');
if (universityService) {
    router.use('/universities', createProxyMiddleware(universityService));
}

const assessmentServicePrefixes = [
    '/personality-quizzes',
    '/attempts',
    '/my-attempts',
    '/admin/personality-quizzes',
    '/soft-skills'
];

assessmentServicePrefixes.forEach((prefix) => {
    const service = getService(prefix);
    if (service) {
        router.use(prefix, createProxyMiddleware(service));
    }
});

const mockExamPrefixes = [
    '/mock-exams',
    '/student/mock-exams',
    '/student/exam-results',
    '/student/exam-stats',
    '/admin',
    '/subjects',
    '/subject-combinations',
    '/exam-results'
];

mockExamPrefixes.forEach((prefix) => {
    const service = getService(prefix);
    if (service) {
        router.use(prefix, createProxyMiddleware(service));
    }
});

const studentServicePrefixes = [
    '/student-profile',
    '/student'
];

studentServicePrefixes.forEach((prefix) => {
    const service = getService(prefix);
    if (service) {
        router.use(prefix, createProxyMiddleware(service));
    }
});

const contentServicePrefixes = [
    '/forum',
    '/violations',
    '/reports'
];

contentServicePrefixes.forEach((prefix) => {
    const service = getService(prefix);
    if (service) {
        router.use(prefix, createProxyMiddleware(service));
    }
});

const messagingServicePrefixes = [
    '/messages'
];

messagingServicePrefixes.forEach((prefix) => {
    const service = getService(prefix);
    if (service) {
        router.use(prefix, createProxyMiddleware(service));
    }
});

// Thêm các services khác tương tự:
// const universityService = getService('/university');
// if (universityService) {
//     router.use('/university', createProxyMiddleware(universityService));
// }

// const quizService = getService('/quiz');
// if (quizService) {
//     router.use('/quiz', createProxyMiddleware(quizService));
// }

// ==================== Catch All ====================
/**
 * Catch all routes không được xử lý
 */
router.use('{/*path}', (req, res) => {
    const path = req.path;
    const servicePrefix = path.split('/')[1]; // Lấy service prefix (e.g., 'auth' from '/auth/login')

    console.warn(`⚠️  Service not found: /${servicePrefix}`);

    res.status(404).json({
        success: false,
        message: `Service "/${servicePrefix}" không tìm thấy`,
        availableServices: Object.keys(getAllServices()).map(key => getAllServices()[key].prefix),
        requestedPath: path
    });
});

// ==================== Utilities ====================
/**
 * Generate unique request ID
 */
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default router;
