import recommendationService from '../services/recommendationService.js';
import seedService from '../services/seedService.js';
import { HttpError } from '../utils/httpError.js';

export const getMajorRecommendations = async (req, res, next) => {
  try {
    if (req.role !== 'admin' && String(req.userId) !== String(req.params.userId)) {
      throw new HttpError(403, 'Ban khong co quyen xem goi y cua hoc sinh nay');
    }

    const data = await recommendationService.getRecommendations(req.params.userId, req.query);
    res.status(200).json({
      success: true,
      message: 'Lay goi y nganh thanh cong',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const saveRecommendationFeedback = async (req, res, next) => {
  try {
    const data = await recommendationService.saveFeedback(req, req.body);
    res.status(200).json({
      success: true,
      message: 'Luu phan hoi goi y thanh cong',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const seedRecommendationData = async (req, res, next) => {
  try {
    const data = await seedService.seedDefaults();
    res.status(200).json({
      success: true,
      message: 'Seed recommendation data thanh cong',
      data,
    });
  } catch (error) {
    next(error);
  }
};
