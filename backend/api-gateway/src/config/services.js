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
    mockExams: {
        name: 'Mock Exams Service',
        url: process.env.MOCK_EXAMS_SERVICE_URL || 'http://localhost:5002',
        prefix: '/mock-exams',
        targetPrefix: '/api/mock-exams',
        timeout: 30000,
        retries: 1
    },
    studentMockExams: {
        name: 'Mock Exams Service',
        url: process.env.MOCK_EXAMS_SERVICE_URL || 'http://localhost:5002',
        prefix: '/student/mock-exams',
        targetPrefix: '/api/student/mock-exams',
        timeout: 30000,
        retries: 1
    },
    studentExamResults: {
        name: 'Mock Exams Service',
        url: process.env.MOCK_EXAMS_SERVICE_URL || 'http://localhost:5002',
        prefix: '/student/exam-results',
        targetPrefix: '/api/student/exam-results',
        timeout: 30000,
        retries: 1
    },
    studentExamStats: {
        name: 'Mock Exams Service',
        url: process.env.MOCK_EXAMS_SERVICE_URL || 'http://localhost:5002',
        prefix: '/student/exam-stats',
        targetPrefix: '/api/student/exam-stats',
        timeout: 30000,
        retries: 1
    },
    adminMockExams: {
        name: 'Mock Exams Service',
        url: process.env.MOCK_EXAMS_SERVICE_URL || 'http://localhost:5002',
        prefix: '/admin',
        targetPrefix: '/api/admin',
        timeout: 30000,
        retries: 1
    },
    subjects: {
        name: 'Mock Exams Service',
        url: process.env.MOCK_EXAMS_SERVICE_URL || 'http://localhost:5002',
        prefix: '/subjects',
        targetPrefix: '/api/subjects',
        timeout: 30000,
        retries: 1
    },
    subjectCombinations: {
        name: 'Mock Exams Service',
        url: process.env.MOCK_EXAMS_SERVICE_URL || 'http://localhost:5002',
        prefix: '/subject-combinations',
        targetPrefix: '/api/subject-combinations',
        timeout: 30000,
        retries: 1
    },
    examResults: {
        name: 'Mock Exams Service',
        url: process.env.MOCK_EXAMS_SERVICE_URL || 'http://localhost:5002',
        prefix: '/exam-results',
        targetPrefix: '/api/exam-results',
        timeout: 30000,
        retries: 1
    },
    studentProfile: {
        name: 'Student Service',
        url: process.env.STUDENT_SERVICE_URL || 'http://localhost:5003',
        prefix: '/student-profile',
        targetPrefix: '/api/student-profile',
        timeout: 30000,
        retries: 1
    },
    studentScores: {
        name: 'Student Service',
        url: process.env.STUDENT_SERVICE_URL || 'http://localhost:5003',
        prefix: '/student',
        targetPrefix: '/api/student',
        timeout: 30000,
        retries: 1
    },
    forum: {
        name: 'Content Service',
        url: process.env.CONTENT_SERVICE_URL || 'http://localhost:5004',
        prefix: '/forum',
        targetPrefix: '/api/forum',
        timeout: 30000,
        retries: 1
    },
    violations: {
        name: 'Content Service',
        url: process.env.CONTENT_SERVICE_URL || 'http://localhost:5004',
        prefix: '/violations',
        targetPrefix: '/api/violations',
        timeout: 30000,
        retries: 1
    },
    reports: {
        name: 'Content Service',
        url: process.env.CONTENT_SERVICE_URL || 'http://localhost:5004',
        prefix: '/reports',
        targetPrefix: '/api/violations',
        timeout: 30000,
        retries: 1
    },
    messages: {
        name: 'Messaging Service',
        url: process.env.MESSAGING_SERVICE_URL || 'http://localhost:5005',
        prefix: '/messages',
        targetPrefix: '/api/messages',
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
