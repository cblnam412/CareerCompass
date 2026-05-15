import { env } from '../config/env.js';

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
    throw {
      status: response.status || 500,
      message: body.message || 'University service request failed',
    };
  }

  return body.data ?? body;
};

export const getUniversityById = (universityId) =>
  requestUniversityService(`/api/universities/internal/${universityId}`);

export const getUniversitiesByIds = async (universityIds = []) => {
  const uniqueIds = [...new Set(universityIds.map(String).filter(Boolean))];
  const results = await Promise.allSettled(uniqueIds.map((id) => getUniversityById(id)));
  return results
    .map((result, index) => (result.status === 'fulfilled' ? result.value : { _id: uniqueIds[index], lookupError: result.reason?.message }))
    .filter(Boolean);
};
