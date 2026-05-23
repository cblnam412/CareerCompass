import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let client;
let connectPromise;
let lastErrorMessage;

const createRedisClient = () => {
    const redisClient = createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
        },
    });

    redisClient.on('error', (error) => {
        if (lastErrorMessage !== error.message) {
            console.error('[redis] Connection error:', error.message);
            lastErrorMessage = error.message;
        }
    });

    redisClient.on('ready', () => {
        lastErrorMessage = undefined;
        console.info('[redis] Connected');
    });

    redisClient.on('end', () => {
        console.warn('[redis] Connection closed');
    });

    return redisClient;
};

export const connectRedis = async () => {
    if (!redisUrl) return null;

    if (client?.isReady) return client;
    if (connectPromise) return connectPromise;

    client = client || createRedisClient();
    connectPromise = client.connect()
        .then(() => client)
        .catch((error) => {
            connectPromise = undefined;
            console.error('[redis] Failed to connect:', error.message);
            return null;
        });

    return connectPromise;
};

export const getRedisClient = async () => {
    if (client?.isReady) return client;
    return connectRedis();
};

export const isRedisReady = () => Boolean(client?.isReady);

export const closeRedis = async () => {
    if (client?.isOpen) {
        await client.quit();
    }
};
