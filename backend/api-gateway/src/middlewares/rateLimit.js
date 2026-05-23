import { getRedisClient } from '../utils/redisClient.js';

const fallbackRequests = new Map();

const normalizeIp = (req) => (
    req.ip || req.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
);

const applyHeaders = (res, { limit, remaining, ttlMs }) => {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + ttlMs / 1000));
};

const fallbackIsAllowed = (key, maxRequests, windowMs) => {
    const now = Date.now();
    const timestamps = (fallbackRequests.get(key) || []).filter((ts) => now - ts < windowMs);

    if (timestamps.length >= maxRequests) {
        fallbackRequests.set(key, timestamps);
        return { allowed: false, count: timestamps.length, ttlMs: windowMs - (now - timestamps[0]) };
    }

    timestamps.push(now);
    fallbackRequests.set(key, timestamps);
    return { allowed: true, count: timestamps.length, ttlMs: windowMs };
};

export const createRedisRateLimitMiddleware = ({
    enabled = true,
    maxRequests = 100,
    windowMs = 60000,
    keyPrefix = 'api-gateway:rate-limit',
} = {}) => async (req, res, next) => {
    if (!enabled || req.method === 'OPTIONS' || req.path === '/health') {
        return next();
    }

    const ip = normalizeIp(req);
    const key = `${keyPrefix}:${ip}`;

    try {
        const redis = await getRedisClient();
        if (redis?.isReady) {
            const count = await redis.incr(key);
            if (count === 1) {
                await redis.pExpire(key, windowMs);
            }

            const ttlMs = Math.max(await redis.pTTL(key), 0);
            applyHeaders(res, {
                limit: maxRequests,
                remaining: maxRequests - count,
                ttlMs: ttlMs || windowMs,
            });

            if (count > maxRequests) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests',
                    retryAfter: Math.ceil((ttlMs || windowMs) / 1000),
                });
            }

            return next();
        }
    } catch (error) {
        console.error('[rate-limit] Redis unavailable, using in-memory fallback:', error.message);
    }

    const fallback = fallbackIsAllowed(key, maxRequests, windowMs);
    applyHeaders(res, {
        limit: maxRequests,
        remaining: maxRequests - fallback.count,
        ttlMs: fallback.ttlMs,
    });

    if (!fallback.allowed) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests',
            retryAfter: Math.ceil(fallback.ttlMs / 1000),
        });
    }

    return next();
};
