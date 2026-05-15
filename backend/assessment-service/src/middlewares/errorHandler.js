export const notFound = (req, res, next) => {
  const error = new Error(`Khong tim thay route ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.message || 'Loi server',
  };

  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV === 'development') payload.stack = error.stack;

  res.status(statusCode).json(payload);
};
