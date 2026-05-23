import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendAdminAlert } from './emailAlertService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.resolve(__dirname, '../../logs');
const requestLogFile = path.join(logDir, 'api-requests.log');
const maxInMemoryLogs = Number(process.env.MONITORING_MEMORY_LOG_LIMIT || 200);
const slowRequestThresholdMs = Number(process.env.SLOW_REQUEST_THRESHOLD_MS || 5000);

const recentLogs = [];

export const generateRequestId = () => (
    `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
);

const ensureLogDir = () => {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
};

const appendLogLine = (entry) => {
    ensureLogDir();
    fs.appendFile(requestLogFile, `${JSON.stringify(entry)}\n`, (error) => {
        if (error) {
            console.error('[monitoring] Failed to write request log.', error.message);
        }
    });
};

const rememberLog = (entry) => {
    recentLogs.unshift(entry);
    if (recentLogs.length > maxInMemoryLogs) {
        recentLogs.length = maxInMemoryLogs;
    }
};

export const logApiRequest = (entry) => {
    const normalizedEntry = {
        timestamp: new Date().toISOString(),
        ...entry,
    };

    rememberLog(normalizedEntry);
    appendLogLine(normalizedEntry);
    console.info('[api-request]', normalizedEntry);
};

export const requestMonitoring = (req, res, next) => {
    const start = process.hrtime.bigint();
    req.requestId = req.get('x-request-id') || generateRequestId();
    res.setHeader('x-request-id', req.requestId);

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const entry = {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            ip: req.ip,
            userAgent: req.get('user-agent'),
            contentLength: res.get('content-length') || 0,
        };

        logApiRequest(entry);

        if (durationMs >= slowRequestThresholdMs) {
            sendAdminAlert({
                service: 'API Gateway',
                status: res.statusCode,
                method: req.method,
                path: req.originalUrl,
                requestId: req.requestId,
                ip: req.ip,
                timestamp: new Date().toISOString(),
                message: `Slow request detected: ${durationMs.toFixed(2)} ms`,
            });
        }
    });

    next();
};

export const getMonitoringSnapshot = () => {
    const byStatus = recentLogs.reduce((acc, log) => {
        const bucket = `${Math.floor(log.status / 100)}xx`;
        acc[bucket] = (acc[bucket] || 0) + 1;
        return acc;
    }, {});

    const totalDuration = recentLogs.reduce((sum, log) => sum + Number(log.durationMs || 0), 0);

    return {
        success: true,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        recentRequestCount: recentLogs.length,
        averageDurationMs: recentLogs.length
            ? Number((totalDuration / recentLogs.length).toFixed(2))
            : 0,
        byStatus,
        slowRequestThresholdMs,
        timestamp: new Date().toISOString(),
    };
};

export const getRecentLogs = (limit = 50) => recentLogs.slice(0, Number(limit) || 50);

export const alertAbnormalError = (payload) => {
    sendAdminAlert({
        service: payload.service || 'API Gateway',
        status: payload.status || 500,
        method: payload.method,
        path: payload.path,
        requestId: payload.requestId,
        ip: payload.ip,
        timestamp: new Date().toISOString(),
        message: payload.message,
        stack: payload.stack,
    });
};
