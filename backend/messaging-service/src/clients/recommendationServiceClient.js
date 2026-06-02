import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const requestRecommendationService = async (path, token, options = {}) => {
  const response = await fetch(`${env.recommendationServiceUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success === false) {
    throw new HttpError(response.status || 500, body.message || 'Recommendation service request failed');
  }

  return body.data ?? body;
};

export const getMyMajorRecommendations = (userId, token, query = {}) => {
  const params = new URLSearchParams({
    limit: String(query.limit || 5),
    minScore: String(query.minScore || 0),
  });

  return requestRecommendationService(`/api/major-recommendations/${userId}?${params.toString()}`, token);
};
