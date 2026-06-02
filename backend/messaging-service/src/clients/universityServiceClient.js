import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const requestUniversityService = async (path, options = {}) => {
  const response = await fetch(`${env.universityServiceUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': env.internalServiceToken,
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success === false) {
    throw new HttpError(response.status || 500, body.message || 'University service request failed');
  }

  return body.data ?? body;
};

export const getUniversityById = (universityId) =>
  requestUniversityService(`/api/universities/internal/${universityId}`);

export const getUniversitiesByIds = async (universityIds = []) => {
  const uniqueIds = [...new Set(universityIds.map(String).filter(Boolean))];
  const results = await Promise.allSettled(uniqueIds.map((id) => getUniversityById(id)));
  return results.map((result, index) =>
    result.status === 'fulfilled'
      ? result.value
      : { _id: uniqueIds[index], lookupError: result.reason?.message || 'Lookup failed' },
  );
};

export const searchUniversities = (search = '', limit = 5) => {
  const params = new URLSearchParams({
    page: '1',
    limit: String(limit),
  });
  if (search) params.set('search', search);

  return requestUniversityService(`/api/universities?${params.toString()}`);
};

export const searchMajors = (keyword = '') => {
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  return requestUniversityService(`/api/majors/search?${params.toString()}`);
};
