import http from 'http';
import https from 'https';

/**
 * Proxy request helper - Gửi request tới backend service
 * @param {object} options - Proxy options
 * @returns {Promise} Response từ backend
 */
export const proxyRequest = (options) => {
    return new Promise((resolve, reject) => {
        const protocol = options.url.startsWith('https') ? https : http;
        const isHttps = protocol === https;

        const url = new URL(options.url);
        const proxyOptions = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: {
                ...options.headers,
                'Content-Type': 'application/json'
            },
            timeout: options.timeout || 30000
        };

        const req = protocol.request(proxyOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const body = data ? JSON.parse(data) : null;
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Lỗi proxy request: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout khi kết nối tới service'));
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
};

/**
 * Transform request headers cho proxy
 * Lọc out những headers không cần thiết
 */
export const transformHeaders = (headers) => {
    const forwarded = {
        ...headers,
        'x-forwarded-by': 'api-gateway'
    };

    // Loại bỏ những headers không cần thiết
    const headersToRemove = [
        'host',
        'connection',
        'content-length'
    ];

    headersToRemove.forEach(header => {
        delete forwarded[header];
    });

    return forwarded;
};

/**
 * Build URL cho backend service
 * @param {string} baseUrl - Base URL của service
 * @param {string} path - Path của request
 * @param {object} query - Query parameters
 * @returns {string} Full URL
 */
export const buildServiceUrl = (baseUrl, path, query = {}) => {
    let url = `${baseUrl}${path}`;
    
    const queryString = new URLSearchParams(query).toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    return url;
};

/**
 * Retry logic cho failed requests
 * @param {function} fn - Function để retry
 * @param {number} retries - Số lần retry
 * @returns {Promise} Result
 */
export const withRetry = async (fn, retries = 1) => {
    let lastError;

    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < retries) {
                // Wait trước khi retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                console.log(`⏳ Retry attempt ${i + 1}/${retries}...`);
            }
        }
    }

    throw lastError;
};
