const UNIVERSITY_SERVICE_URL = process.env.UNIVERSITY_SERVICE_URL || 'http://localhost:5001';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'doan1-dev-internal-token';

const requestUniversityService = async (path, options = {}) => {
    const response = await fetch(`${UNIVERSITY_SERVICE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'x-internal-token': INTERNAL_SERVICE_TOKEN,
            ...(options.headers || {})
        }
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body.success === false) {
        throw {
            status: response.status || 500,
            message: body.message || 'University service request failed'
        };
    }

    return body.data ?? body;
};

export const getUniversityById = (universityId) =>
    requestUniversityService(`/api/universities/internal/${universityId}`);

export const createAffiliation = (payload) =>
    requestUniversityService('/api/universities/affiliations/internal', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
