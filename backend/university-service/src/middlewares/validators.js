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

export const validateMajorData = (req, res, next) => {
  const isCreate = req.method === 'POST';
  const { name, category, description } = req.body;

  if (isCreate && (!name || !category)) {
    return res.status(400).json({
      success: false,
      message: 'Tên ngành và nhóm ngành là bắt buộc',
    });
  }

  for (const [key, value] of Object.entries({ name, category, description })) {
    if (value !== undefined && typeof value !== 'string') {
      return res.status(400).json({
        success: false,
        message: `${key} phải là chuỗi`,
      });
    }
  }

  next();
};

export const validateSearchParams = (req, res, next) => {
  const allowedSortBy = ['name', 'category', 'createdAt'];
  const { page, limit, sortBy = 'name', sortOrder = 'asc' } = req.query;

  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ success: false, message: 'page không hợp lệ' });
  }

  if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
    return res.status(400).json({ success: false, message: 'limit không hợp lệ' });
  }

  if (!allowedSortBy.includes(sortBy)) {
    return res.status(400).json({ success: false, message: 'sortBy không hợp lệ' });
  }

  if (!['asc', 'desc'].includes(sortOrder)) {
    return res.status(400).json({ success: false, message: 'sortOrder không hợp lệ' });
  }

  next();
};
