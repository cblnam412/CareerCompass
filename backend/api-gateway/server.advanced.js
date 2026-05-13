/**
 * ADVANCED GATEWAY EXAMPLE
 * ========================
 * Tệp này shows how to use advanced features như:
 * - Rate Limiting
 * - Circuit Breaker
 * - Response Caching
 * - Service Health Monitoring
 * 
 * Uncomment các features bạn muốn sử dụng
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import gatewayRoutes from './src/routes/gateway.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import {
    RateLimiter,
    CircuitBreaker,
    ResponseCache,
    createRateLimitMiddleware,
    createCircuitBreakerMiddleware,
    checkServiceHealth
} from './src/utils/advancedUtils.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Initialize Advanced Features ====================

// Rate Limiter (100 requests per 60 seconds per IP)
const rateLimiter = new RateLimiter(
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
);

// Circuit Breakers (một cho mỗi service)
const circuitBreakers = {
    auth: new CircuitBreaker(5, 60000),
    university: new CircuitBreaker(5, 60000),
    quiz: new CircuitBreaker(5, 60000)
};

// Response Cache
const responseCache = new ResponseCache(5 * 60 * 1000); // 5 minutes

// ==================== Middleware ====================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan(':remote-addr - :method :url :status :res[content-length] - :response-time ms'));

// Rate Limiting Middleware (Optional)
if (process.env.RATE_LIMIT_ENABLED === 'true') {
    console.log('✅ Rate Limiting enabled');
    app.use(createRateLimitMiddleware(rateLimiter));
}

// Circuit Breaker Middleware (Optional)
if (process.env.CIRCUIT_BREAKER_ENABLED === 'true') {
    console.log('✅ Circuit Breaker enabled');
    app.use((req, res, next) => {
        const service = req.path.split('/')[1]; // Extract service name
        const breaker = circuitBreakers[service];

        if (breaker && !breaker.canAttempt()) {
            return res.status(503).json({
                success: false,
                message: `Service "${service}" temporarily unavailable`,
                state: breaker.getState()
            });
        }

        next();
    });
}

// ==================== Routes ====================

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Gateway đang hoạt động',
        timestamp: new Date().toISOString(),
        features: {
            rateLimiting: process.env.RATE_LIMIT_ENABLED === 'true',
            circuitBreaker: process.env.CIRCUIT_BREAKER_ENABLED === 'true',
            caching: true,
            healthCheck: true
        }
    });
});

// Service Health Status
app.get('/api/gateway/health-status', async (req, res) => {
    const services = {
        auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
        // university: process.env.UNIVERSITY_SERVICE_URL || 'http://localhost:5001',
        // quiz: process.env.QUIZ_SERVICE_URL || 'http://localhost:5002'
    };

    const healthStatus = {};

    for (const [name, url] of Object.entries(services)) {
        healthStatus[name] = await checkServiceHealth(url);
    }

    res.status(200).json({
        success: true,
        services: healthStatus,
        timestamp: new Date().toISOString()
    });
});

// Get Rate Limiter Stats
app.get('/api/gateway/rate-limit-stats', (req, res) => {
    const clientIp = req.ip;
    const count = rateLimiter.getCount(clientIp);

    res.status(200).json({
        success: true,
        clientIp: clientIp,
        requests: count,
        limit: rateLimiter.maxRequests,
        windowMs: rateLimiter.windowMs,
        remaining: Math.max(0, rateLimiter.maxRequests - count)
    });
});

// Get Circuit Breaker Stats
app.get('/api/gateway/circuit-breaker-stats', (req, res) => {
    const stats = {};

    for (const [service, breaker] of Object.entries(circuitBreakers)) {
        stats[service] = breaker.getState();
    }

    res.status(200).json({
        success: true,
        circuitBreakers: stats,
        timestamp: new Date().toISOString()
    });
});

// Main gateway routes
app.use('/api', gatewayRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route không tìm thấy',
        path: req.originalUrl
    });
});

// Error handler
app.use(errorHandler);

// ==================== Server ====================

app.listen(PORT, () => {
    console.log(`\n✅ Advanced API Gateway đang chạy trên port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`📊 Status: http://localhost:${PORT}/api/gateway/health-status`);
    
    if (process.env.RATE_LIMIT_ENABLED === 'true') {
        console.log(`⏱️  Rate Limit Stats: http://localhost:${PORT}/api/gateway/rate-limit-stats`);
    }
    
    if (process.env.CIRCUIT_BREAKER_ENABLED === 'true') {
        console.log(`🔌 Circuit Breaker Stats: http://localhost:${PORT}/api/gateway/circuit-breaker-stats`);
    }
    
    console.log();
});

export default app;
