import { env } from '../config/env.js';

const requestMockExamsService = async (path, options = {}) => {
  const response = await fetch(`${env.mockExamsServiceUrl}${path}`, {
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
      message: body.message || 'Mock exams service request failed',
    };
  }

  return body.data ?? body;
};

export const getAllSubjects = async () => {
  const body = await requestMockExamsService('/api/subjects?limit=1000&sort=name');
  return Array.isArray(body) ? body : body.data || [];
};

export const getSubjectById = (subjectId) =>
  requestMockExamsService(`/api/subjects/${subjectId}`);

export const getInternalStudentExamResults = async (studentId) => {
  const body = await requestMockExamsService(`/api/internal/students/${studentId}/exam-results`);
  return Array.isArray(body) ? body : body.data || [];
};
