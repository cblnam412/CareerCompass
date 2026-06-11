import costEstimateService from '../services/costEstimateService.js';

export const estimateUniversityCost = async (req, res, next) => {
  try {
    const data = await costEstimateService.estimate(req.body);
    res.status(200).json({
      success: true,
      message: 'Tinh du toan chi phi thanh cong',
      data,
    });
  } catch (error) {
    next(error);
  }
};
