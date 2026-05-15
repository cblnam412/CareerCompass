import { env } from '../config/env.js';

export const verifyInternalRequest = (req, res, next) => {
  const token = req.headers['x-internal-token'];
  if (!token || token !== env.internalServiceToken) {
    return res.status(403).json({
      success: false,
      message: 'Internal request khong hop le',
    });
  }
  next();
};
