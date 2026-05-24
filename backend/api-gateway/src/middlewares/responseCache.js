import crypto from 'crypto';
import { getRedisClient } from '../utils/redisClient.js';

const DEFAULT_CACHEABLE_STATUSES = new Set([200]);

const hasCacheBypassHeader = (req) => {
    const cacheControl = String(req.headers['cache-control'] || '');
    const pragma = String(req.headers.pragma || '');
    return /no-cache|no-store|max-age=0/i.test(cacheControl) || /no-cache/i.test(pragma);
};

const shouldCacheRequest = (req) => (
    req.method === 'GET'
    && !req.headers.authorization
    && !req.headers.cookie
    && !hasCacheBypassHeader(req)
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
        if (req.method === 'GET') res.setHeader('X-Cache', 'BYPASS');
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
        res.setHeader('X-Cache-Key', cacheKey);
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
    if (!enabled) return 0;

    try {
        const redis = await getRedisClient();
        if (!redis?.isReady) return 0;

        const keys = [];
        let deletedCount = 0;
        for await (const key of redis.scanIterator({
            MATCH: `${keyPrefix}:*`,
            COUNT: 100,
        })) {
            keys.push(key);

            if (keys.length >= 500) {
                deletedCount += await redis.del(keys.splice(0, keys.length));
            }
        }

        if (keys.length > 0) {
            deletedCount += await redis.del(keys);
        }

        return deletedCount;
    } catch (error) {
        console.error('[response-cache] Redis clear failed:', error.message);
        return 0;
    }
};
