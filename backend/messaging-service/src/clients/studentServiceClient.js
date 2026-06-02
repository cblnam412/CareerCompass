import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const requestStudentService = async (path, token, options = {}) => {
  const response = await fetch(`${env.studentServiceUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success === false) {
    throw new HttpError(response.status || 500, body.message || 'Student service request failed');
  }

  return body.data ?? body;
};

export const getMyStudentProfile = (token) =>
  requestStudentService('/api/student-profile/my-profile', token);

export const getMySubjectScores = (userId, token) =>
  requestStudentService(`/api/student/${userId}/all-scores?limit=100`, token);
