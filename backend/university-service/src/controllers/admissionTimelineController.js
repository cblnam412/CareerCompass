import admissionTimelineService from '../services/admissionTimelineService.js';

export const getAdmissionTimeline = async (req, res, next) => {
  try {
    const data = admissionTimelineService.getTimeline(req.query);
    res.status(200).json({
      success: true,
      message: 'Lay lich tuyen sinh thanh cong',
      data,
    });
  } catch (error) {
    next(error);
  }
};
