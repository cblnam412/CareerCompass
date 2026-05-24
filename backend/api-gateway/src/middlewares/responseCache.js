import crypto from 'crypto';
import { getRedisClient } from '../utils/redisClient.js';

const DEFAULT_CACHEABLE_STATUSES = new Set([200]);

const shouldCacheRequest = (req) => (
    req.method === 'GET'
    && !req.headers.authorization
    && !req.headers.cookie
);

const createCacheKey = (req, prefix) => {
    const rawKey = `${req.method}:${req.originalUrl}`;
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    return `${prefix}:${hash}`;
};

export const createRedisCacheReadMiddleware = ({
    enabled = true,
    ttlSeconds = 60,
    keyPrefix = 'api-gateway:response-cache',
} = {}) => async (req, res, next) => {
    if (!enabled || ttlSeconds <= 0 || !shouldCacheRequest(req)) {
        return next();
    }

    try {
        const redis = await getRedisClient();
        if (!redis?.isReady) return next();

        const cacheKey = createCacheKey(req, keyPrefix);
        const cached = await redis.get(cacheKey);
        if (!cached) {
            res.setHeader('X-Cache', 'MISS');
            return next();
        }

        const payload = JSON.parse(cached);
        res.setHeader('X-Cache', 'HIT');
        Object.entries(payload.headers || {}).forEach(([key, value]) => {
            if (value) res.setHeader(key, value);
        });

        return res.status(payload.statusCode || 200).send(Buffer.from(payload.body, 'base64'));
    } catch (error) {
        console.error('[response-cache] Redis read failed:', error.message);
        return next();
    }
};

export const cacheProxyResponse = async (proxyRes, proxyResData, userReq, {
    enabled = true,
    ttlSeconds = 60,
    keyPrefix = 'api-gateway:response-cache',
    cacheableStatuses = DEFAULT_CACHEABLE_STATUSES,
} = {}) => {
    if (!enabled || ttlSeconds <= 0 || !shouldCacheRequest(userReq)) {
        return;
    }

    if (!cacheableStatuses.has(proxyRes.statusCode)) {
        return;
    }

    const cacheControl = String(proxyRes.headers['cache-control'] || '');
    if (/no-store|private/i.test(cacheControl)) {
        return;
    }

    try {
        const redis = await getRedisClient();
        if (!redis?.isReady) return;

        const payload = {
            statusCode: proxyRes.statusCode,
            headers: {
                'content-type': proxyRes.headers['content-type'],
            },
            body: Buffer.from(proxyResData).toString('base64'),
        };

        await redis.set(createCacheKey(userReq, keyPrefix), JSON.stringify(payload), {
            EX: ttlSeconds,
        });
    } catch (error) {
        console.error('[response-cache] Redis write failed:', error.message);
    }
};

export const clearResponseCache = async ({
    enabled = true,
    keyPrefix = 'api-gateway:response-cache',
} = {}) => {
    if (!enabled) return;

    try {
        const redis = await getRedisClient();
        if (!redis?.isReady) return;

        const keys = [];
        for await (const key of redis.scanIterator({
            MATCH: `${keyPrefix}:*`,
            COUNT: 100,
        })) {
            keys.push(key);
        }

        if (keys.length > 0) {
            await redis.del(keys);
        }
    } catch (error) {
        console.error('[response-cache] Redis clear failed:', error.message);
    }
};
