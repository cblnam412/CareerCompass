// Service Registry - Quản lý các backend services
const services = {
    auth: {
        name: 'Auth Service',
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
        prefix: '/auth',
        timeout: 30000,
        retries: 1
    },
    university: {
        name: 'University Service',
        url: process.env.UNIVERSITY_SERVICE_URL || 'http://localhost:5001',
        prefix: '/universities',
        targetPrefix: '/api/universities',
        timeout: 30000,
        retries: 1
    },
    // Thêm các services khác ở đây
    // university: {
    //     name: 'University Service',
    //     url: process.env.UNIVERSITY_SERVICE_URL || 'http://localhost:5001',
    //     prefix: '/university',
    //     timeout: 30000,
    //     retries: 1
    // },
    // quiz: {
    //     name: 'Quiz Service',
    //     url: process.env.QUIZ_SERVICE_URL || 'http://localhost:5002',
    //     prefix: '/quiz',
    //     timeout: 30000,
    //     retries: 1
    // }
};

/**
 * Lấy service configuration theo prefix
 * @param {string} prefix - Prefix của service (e.g., '/auth')
 * @returns {object|null} Service configuration hoặc null
 */
export const getService = (prefix) => {
    for (const [key, service] of Object.entries(services)) {
        if (service.prefix === prefix) {
            return service;
        }
    }
    return null;
};

/**
 * Lấy tất cả services
 * @returns {object} Tất cả services
 */
export const getAllServices = () => services;

/**
 * Kiểm tra service có available không
 * @param {string} serviceKey - Key của service
 * @returns {boolean} True nếu service available
 */
export const isServiceAvailable = (serviceKey) => {
    return services.hasOwnProperty(serviceKey);
};

export default services;
