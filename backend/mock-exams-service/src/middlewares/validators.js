import mongoose from 'mongoose';

export const validateObjectIdParam = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({
      success: false,
      message: `${paramName} khong hop le`,
    });
  }
  next();
};

export const validatePaginationQuery = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ success: false, message: 'page khong hop le' });
  }

  if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
    return res.status(400).json({ success: false, message: 'limit khong hop le' });
  }

  next();
};

export const validateSubjectPayload = (req, res, next) => {
  const isCreate = req.method === 'POST';
  const { name, code, description, status } = req.body;

  if (isCreate && (!name || typeof name !== 'string')) {
    return res.status(400).json({ success: false, message: 'Ten mon hoc la bat buoc' });
  }

  for (const [key, value] of Object.entries({ name, code, description, status })) {
    if (value !== undefined && typeof value !== 'string') {
      return res.status(400).json({ success: false, message: `${key} phai la chuoi` });
    }
  }

  next();
};

export const validateSubjectCombinationPayload = (req, res, next) => {
  const isCreate = req.method === 'POST';
  const { combinationName, subjects } = req.body;

  if (isCreate && (!combinationName || typeof combinationName !== 'string')) {
    return res.status(400).json({ success: false, message: 'Ma to hop la bat buoc' });
  }

  if (subjects !== undefined && !Array.isArray(subjects)) {
    return res.status(400).json({ success: false, message: 'subjects phai la mang' });
  }

  next();
};

export const validateMockExamPayload = (req, res, next) => {
  const isCreate = req.method === 'POST';
  const { title, subject, duration, questions } = req.body;

  if (isCreate && (!title || !subject || duration === undefined || questions === undefined)) {
    return res.status(400).json({
      success: false,
      message: 'Yeu cau thieu: title, subject, duration, questions',
    });
  }

  if (questions !== undefined && !Array.isArray(questions)) {
    return res.status(400).json({ success: false, message: 'questions phai la mang' });
  }

  next();
};
