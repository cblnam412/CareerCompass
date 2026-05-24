import recommendationService from '../services/recommendationService.js';
import seedService from '../services/seedService.js';
import { HttpError } from '../utils/httpError.js';

export const getMajorRecommendations = async (req, res, next) => {
  try {
    if (req.role !== 'admin' && String(req.userId) !== String(req.params.userId)) {
      throw new HttpError(403, 'Bạn không có quyền xem gợi ý của học sinh này');
    }

    const data = await recommendationService.getRecommendations(req.params.userId, req.query);
    res.status(200).json({
      success: true,
      message: 'Lấy gợi ý ngành thành công',
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
      message: 'Lưu phản hồi gợi ý thành công',
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
      message: 'Seed recommendation data thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};
