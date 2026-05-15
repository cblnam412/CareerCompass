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
