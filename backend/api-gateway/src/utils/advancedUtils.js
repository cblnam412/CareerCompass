/**
 * Advanced Gateway Utilities
 * Các utility functions cho advanced features
 */

// ==================== Request Context ====================
/**
 * Extract request context từ req object
 */
export const getRequestContext = (req) => {
    return {
        id: req.get('x-request-id') || generateId(),
        method: req.method,
        path: req.path,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
        headers: req.headers
    };
};

/**
 * Generate unique ID
 */
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ==================== Rate Limiting ====================
/**
 * Simple in-memory rate limiter
 */
export class RateLimiter {
    constructor(maxRequests = 100, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    /**
     * Check nếu request được allow
     * @param {string} key - Rate limit key (e.g., IP address hoặc user ID)
     * @returns {boolean} True nếu request được allow
     */
    isAllowed(key) {
        const now = Date.now();
        
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }

        const timestamps = this.requests.get(key);
        
        // Remove old timestamps outside window
        const validTimestamps = timestamps.filter(
            ts => now - ts < this.windowMs
        );

        if (validTimestamps.length < this.maxRequests) {
            validTimestamps.push(now);
            this.requests.set(key, validTimestamps);
            return true;
        }

        return false;
    }

    /**
     * Get request count trong current window
     */
    getCount(key) {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];
        return timestamps.filter(ts => now - ts < this.windowMs).length;
    }
}

// ==================== Circuit Breaker ====================
/**
 * Circuit Breaker Pattern Implementation
 * Ngăn chặn requests tới service khi nó down
 */
export class CircuitBreaker {
    constructor(failureThreshold = 5, resetTimeout = 60000) {
        this.failureThreshold = failureThreshold;
        this.resetTimeout = resetTimeout;
        this.failureCount = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
    }

    /**
     * Record successful request
     */
    recordSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    /**
     * Record failed request
     */
    recordFailure() {
        this.failureCount++;
        
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.resetTimeout;
            console.warn(`⚠️  Circuit breaker opened. Next attempt at ${new Date(this.nextAttempt)}`);
        }
    }

    /**
     * Check nếu request được allow
     */
    canAttempt() {
        if (this.state === 'CLOSED') return true;
        
        if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
            this.state = 'HALF_OPEN';
            return true;
        }

        return this.state === 'HALF_OPEN';
    }

    /**
     * Get current state
     */
    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            nextAttempt: this.nextAttempt
        };
    }
}

// ==================== Request Validation ====================
/**
 * Validate request format
 */
export const validateRequest = (req) => {
    const errors = [];

    // Check content-type for POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            errors.push('Content-Type must be application/json');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

// ==================== Response Caching ====================
/**
 * Simple response cache
 */
export class ResponseCache {
    constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
        this.cache = new Map();
        this.ttl = ttl;
    }

    /**
     * Get cached response
     */
    get(key) {
        const cached = this.cache.get(key);
        
        if (!cached) return null;
        
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set cache
     */
    set(key, data, ttl = this.ttl) {
        this.cache.set(key, {
            data: data,
            expiresAt: Date.now() + ttl
        });
    }

    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Clear cache by pattern
     */
    clearByPattern(pattern) {
        const regex = new RegExp(pattern);
        for (const [key] of this.cache) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }
}

// ==================== Service Health Check ====================
/**
 * Health check utility
 */
export const checkServiceHealth = async (serviceUrl, timeout = 5000) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${serviceUrl}/health`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        return {
            healthy: response.ok,
            status: response.status,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            healthy: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// ==================== Middleware Factories ====================
/**
 * Create rate limiting middleware
 */
export const createRateLimitMiddleware = (limiter) => {
    return (req, res, next) => {
        const key = req.ip;

        if (!limiter.isAllowed(key)) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests',
                retryAfter: 60
            });
        }

        next();
    };
};

/**
 * Create circuit breaker middleware
 */
export const createCircuitBreakerMiddleware = (breaker) => {
    return (req, res, next) => {
        if (!breaker.canAttempt()) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable',
                state: breaker.getState()
            });
        }

        next();
    };
};

/**
 * Create request validation middleware
 */
export const createValidationMiddleware = () => {
    return (req, res, next) => {
        const validation = validateRequest(req);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request',
                errors: validation.errors
            });
        }

        next();
    };
};
