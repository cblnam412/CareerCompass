import majorComparisonService from '../services/majorComparisonService.js';

export const compareMajors = async (req, res, next) => {
  try {
    const data = await majorComparisonService.compare(req.query);
    res.status(200).json({
      success: true,
      message: 'Lay du lieu so sanh nganh thanh cong',
      data,
    });
  } catch (error) {
    next(error);
  }
};
