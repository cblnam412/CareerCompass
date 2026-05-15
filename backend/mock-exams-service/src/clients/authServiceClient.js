import { env } from '../config/env.js';

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
    throw {
      status: response.status || 500,
      message: body.message || 'Auth service request failed',
    };
  }

  return body.data ?? body;
};

export const getInternalUserById = (userId) =>
  requestAuthService(`/internal/users/${userId}`);

export const getInternalUsersByIds = (userIds) =>
  requestAuthService('/internal/users/batch', {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });
