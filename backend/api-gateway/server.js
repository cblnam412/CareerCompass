import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gatewayRoutes from './src/routes/gateway.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { createRedisRateLimitMiddleware } from './src/middlewares/rateLimit.js';
import { connectRedis, isRedisReady, closeRedis } from './src/utils/redisClient.js';
import { requestMonitoring, alertAbnormalError } from './src/utils/monitoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';
const RESPONSE_CACHE_ENABLED = process.env.RESPONSE_CACHE_ENABLED === 'true';

connectRedis();

// ==================== Middleware ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging and monitoring middleware
app.use(requestMonitoring);

app.use(createRedisRateLimitMiddleware({
    enabled: RATE_LIMIT_ENABLED,
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Gateway đang hoạt động',
        timestamp: new Date().toISOString(),
        redis: {
            connected: isRedisReady(),
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        },
        features: {
            rateLimit: RATE_LIMIT_ENABLED,
            responseCache: RESPONSE_CACHE_ENABLED,
        },
    });
});

// ==================== Routes ====================
app.use('/api', gatewayRoutes);

// 404 handler
app.use('{/*path}', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route không tìm thấy',
        path: req.originalUrl
    });
});

// ==================== Error Handler ====================
app.use(errorHandler);

// ==================== Server ====================
app.listen(PORT, () => {
    console.log(`\nAPI Gateway đang chạy trên port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/health\n`);
});
process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    console.error('[monitoring] Unhandled rejection:', error);
    alertAbnormalError({
        service: 'API Gateway',
        message: error.message,
        stack: error.stack,
    });
});

process.on('SIGTERM', async () => {
    await closeRedis();
    process.exit(0);
});

process.on('SIGINT', async () => {
    await closeRedis();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('[monitoring] Uncaught exception:', error);
    alertAbnormalError({
        service: 'API Gateway',
        message: error.message,
        stack: error.stack,
    });
});
