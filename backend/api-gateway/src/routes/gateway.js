import express from 'express';
import proxy from 'express-http-proxy';
import { getService, getAllServices } from '../config/services.js';
import { APIError, asyncHandler } from '../middlewares/errorHandler.js';
import { createRedisCacheReadMiddleware, cacheProxyResponse, clearResponseCache } from '../middlewares/responseCache.js';
import { alertAbnormalError, generateRequestId, getMonitoringSnapshot, getRecentLogs } from '../utils/monitoring.js';

const router = express.Router();
const RESPONSE_CACHE_ENABLED = process.env.RESPONSE_CACHE_ENABLED !== 'false';
const RESPONSE_CACHE_TTL_SECONDS = Number(process.env.RESPONSE_CACHE_TTL_SECONDS || 60);
const cacheReadMiddleware = createRedisCacheReadMiddleware({
    enabled: RESPONSE_CACHE_ENABLED,
    ttlSeconds: RESPONSE_CACHE_TTL_SECONDS,
});

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
    const proxyMiddleware = proxy(service.url, {
        // Transform request path
        proxyReqPathResolver: (req) => {
            const path = req.url === service.prefix
                ? '/'
                : req.url.startsWith(`${service.prefix}/`)
                    ? req.url.slice(service.prefix.length)
                    : req.url;
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
                'x-request-id': srcReq.requestId || generateRequestId(),
                'x-forwarded-proto': srcReq.protocol,
                'x-forwarded-host': srcReq.get('host'),
                'x-real-ip': srcReq.ip
            };

            // Log request
            console.log(`📤 Forwarding ${srcReq.method} ${service.prefix}${proxyReqOpts.path} to ${service.url}`);

            return proxyReqOpts;
        },

        userResDecorator: async (proxyRes, proxyResData, userReq) => {
            if (proxyRes.statusCode >= 500) {
                alertAbnormalError({
                    service: service.name,
                    status: proxyRes.statusCode,
                    method: userReq.method,
                    path: userReq.originalUrl,
                    requestId: userReq.requestId,
                    ip: userReq.ip,
                    message: `Service returned ${proxyRes.statusCode}`,
                });
            }

            if (userReq.method !== 'GET' && proxyRes.statusCode < 400) {
                await clearResponseCache({ enabled: RESPONSE_CACHE_ENABLED });
            }

            await cacheProxyResponse(proxyRes, proxyResData, userReq, {
                enabled: RESPONSE_CACHE_ENABLED,
                ttlSeconds: RESPONSE_CACHE_TTL_SECONDS,
            });

            return proxyResData;
        },

        // Handle error
        onError: (err, req, res) => {
            console.error(`❌ Error from ${service.name}:`, err.message);
            
            alertAbnormalError({
                service: service.name,
                status: 503,
                method: req.method,
                path: req.originalUrl,
                requestId: req.requestId,
                ip: req.ip,
                message: err.message,
                stack: err.stack,
            });

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

    return [cacheReadMiddleware, proxyMiddleware];
};

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'doan1-dev-internal-token';

const requestJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => ({}));

    if (!response.ok || body.success === false) {
        throw new APIError(body.message || `Request failed: ${url}`, response.status || 500);
    }

    return body.data ?? body;
};

const forwardJsonRequest = (service, targetPath) => asyncHandler(async (req, res) => {
    const response = await fetch(`${service.url}${targetPath}`, {
        method: req.method,
        headers: {
            'content-type': 'application/json',
            ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
            'x-forwarded-by': 'api-gateway',
            'x-original-url': req.originalUrl,
            'x-original-method': req.method,
            'x-request-id': req.requestId || generateRequestId(),
        },
        body: JSON.stringify(req.body || {}),
    });
    const responseBody = await response.text();

    if (response.status >= 500) {
        alertAbnormalError({
            service: service.name,
            status: response.status,
            method: req.method,
            path: req.originalUrl,
            requestId: req.requestId,
            ip: req.ip,
            message: `Service returned ${response.status}`,
        });
    }

    res
        .status(response.status)
        .type(response.headers.get('content-type') || 'application/json')
        .send(responseBody);
});

const verifyAdminRequest = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new APIError('Token khong duoc tim thay', 401);

    const authService = getService('/auth');
    const verification = await requestJson(`${authService.url}/verify`, {
        headers: { Authorization: authHeader }
    });

    if (verification.role !== 'admin') {
        throw new APIError('Ban khong co quyen truy cap', 403);
    }
};

router.get('/gateway/monitoring/status', asyncHandler(async (req, res) => {
    await verifyAdminRequest(req);
    res.status(200).json(getMonitoringSnapshot());
}));

router.get('/gateway/monitoring/logs', asyncHandler(async (req, res) => {
    await verifyAdminRequest(req);
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    res.status(200).json({
        success: true,
        logs: getRecentLogs(limit),
        timestamp: new Date().toISOString()
    });
}));

router.get('/admin/stats', asyncHandler(async (req, res) => {
    await verifyAdminRequest(req);

    const authService = getService('/auth');
    const universityService = getService('/universities');
    const mockExamsService = getService('/mock-exams');
    const internalHeaders = { 'x-internal-token': INTERNAL_SERVICE_TOKEN };

    const [authStats, universityStats, mockStats] = await Promise.all([
        requestJson(`${authService.url}/internal/stats`, { headers: internalHeaders }),
        requestJson(`${universityService.url}/api/universities/internal/stats`, { headers: internalHeaders }),
        requestJson(`${mockExamsService.url}/api/internal/stats`, { headers: internalHeaders })
    ]);

    const stats = {
        ...(mockStats.stats || {}),
        ...authStats,
        ...universityStats
    };

    res.status(200).json({
        success: true,
        stats,
        testResultsData: mockStats.testResultsData || []
    });
}));

/**
 * Auth Service Routes
 * /api/auth/*
 */
const authService = getService('/auth');
if (authService) {
    router.post('/auth/login', forwardJsonRequest(authService, '/login'));
    router.post('/auth/register', forwardJsonRequest(authService, '/register'));
    router.use('/auth', createProxyMiddleware(authService));
}

const universityService = getService('/universities');
if (universityService) {
    router.use('/universities', createProxyMiddleware(universityService));
}

const adminUserService = getService('/admin/users');
if (adminUserService) {
    router.use('/admin/users', createProxyMiddleware(adminUserService));
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
        if (prefix === '/student-profile') {
            router.put('/student-profile/update', forwardJsonRequest(service, '/api/student-profile/update'));
            router.patch('/student-profile/update', forwardJsonRequest(service, '/api/student-profile/update'));
        }
        router.use(prefix, createProxyMiddleware(service));
    }
});

const recommendationServicePrefixes = [
    '/major-recommendations'
];

recommendationServicePrefixes.forEach((prefix) => {
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

export default router;
