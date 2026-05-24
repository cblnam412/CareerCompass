import mongoose from 'mongoose';

export const validateObjectIdParam = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({
      success: false,
      message: `${paramName} không hợp lệ`,
    });
  }
  next();
};

export const validatePaginationQuery = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ success: false, message: 'page không hợp lệ' });
  }

  if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
    return res.status(400).json({ success: false, message: 'limit không hợp lệ' });
  }

  next();
};

export const validateSubjectPayload = (req, res, next) => {
  const isCreate = req.method === 'POST';
  const { name, code, description, status } = req.body;

  if (isCreate && (!name || typeof name !== 'string')) {
    return res.status(400).json({ success: false, message: 'Tên môn học là bắt buộc' });
  }

  for (const [key, value] of Object.entries({ name, code, description, status })) {
    if (value !== undefined && typeof value !== 'string') {
      return res.status(400).json({ success: false, message: `${key} phải là chuỗi` });
    }
  }

  next();
};

export const validateSubjectCombinationPayload = (req, res, next) => {
  const isCreate = req.method === 'POST';
  const { combinationName, subjects } = req.body;

  if (isCreate && (!combinationName || typeof combinationName !== 'string')) {
    return res.status(400).json({ success: false, message: 'Mã tổ hợp là bắt buộc' });
  }

  if (subjects !== undefined && !Array.isArray(subjects)) {
    return res.status(400).json({ success: false, message: 'subjects phải là mảng' });
  }

  next();
};

export const validateMockExamPayload = (req, res, next) => {
  const isCreate = req.method === 'POST';
  const { title, subject, duration, questions } = req.body;

  if (isCreate && (!title || !subject || duration === undefined || questions === undefined)) {
    return res.status(400).json({
      success: false,
      message: 'Yêu cầu thiếu: title, subject, duration, questions',
    });
  }

  if (questions !== undefined && !Array.isArray(questions)) {
    return res.status(400).json({ success: false, message: 'questions phải là mảng' });
  }

  next();
};
