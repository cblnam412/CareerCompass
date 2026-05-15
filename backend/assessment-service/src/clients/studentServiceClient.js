import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new HttpError(response.status, payload.message || 'Student service request failed', payload);
  }
  return payload.data ?? payload;
};

export const updateAssessmentResults = async (studentId, resultPayload) => {
  const response = await fetch(`${env.studentServiceUrl}/api/internal/student/${studentId}/assessment-results`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': env.internalServiceToken,
    },
    body: JSON.stringify(resultPayload),
  });

  return parseResponse(response);
};
