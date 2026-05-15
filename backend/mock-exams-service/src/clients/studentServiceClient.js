import { env } from '../config/env.js';

const requestStudentService = async (path, options = {}) => {
  const response = await fetch(`${env.studentServiceUrl}${path}`, {
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
      message: body.message || 'Student service request failed',
    };
  }

  return body.data ?? body;
};

export const updateStudentScoreAfterExam = (studentId, subjectId, score) =>
  requestStudentService(`/api/internal/student/${studentId}/subject/${subjectId}/score`, {
    method: 'PATCH',
    body: JSON.stringify({ score }),
  });
