import studentProfileService from '../services/studentProfileService.js';

export const getMyStudentProfile = async (req, res, next) => {
  try {
    const data = await studentProfileService.getMyProfile(req.userId);
    res.status(200).json({
      success: true,
      message: 'Lay ho so hoc sinh thanh cong',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudentProfile = async (req, res, next) => {
  try {
    const data = await studentProfileService.updateProfile(
      { userId: req.userId, role: req.role },
      req.body,
    );
    res.status(200).json({
      success: true,
      message: 'Cap nhat ho so hoc sinh thanh cong',
      data,
    });
  } catch (error) {
    next(error);
  }
};
