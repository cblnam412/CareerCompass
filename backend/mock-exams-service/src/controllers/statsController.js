import statsService from '../services/statsService.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const data = await statsService.getAdminStats();
    res.status(200).json({
      success: true,
      ...data,
      data,
    });
  } catch (error) {
    next(error);
  }
};
