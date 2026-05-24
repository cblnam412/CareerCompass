import { env } from '../config/env.js';

export const verifyInternalRequest = (req, res, next) => {
  if (req.get('x-internal-token') !== env.internalServiceToken) {
    return res.status(403).json({
      success: false,
      message: 'Internal service token không hợp lệ',
    });
  }

  next();
};
