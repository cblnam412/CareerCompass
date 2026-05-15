import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const requestAuthService = async (path, options = {}) => {
  const response = await fetch(`${env.authServiceUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': env.internalServiceToken,
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success === false) {
    throw new HttpError(response.status || 500, body.message || 'Auth service request failed');
  }

  return body.data ?? body;
};

export const getUserById = (userId) =>
  requestAuthService(`/internal/users/${userId}`);

export const getUsersByIds = (userIds = []) =>
  requestAuthService('/internal/users/batch', {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });

export const updateUserStatus = (userId, payload) =>
  requestAuthService(`/internal/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
