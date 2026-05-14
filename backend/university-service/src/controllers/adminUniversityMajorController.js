import universityMajorService from '../services/universityMajorService.js';

export const getUniversityMajorsForAdmin = async (req, res, next) => {
  try {
    const result = await universityMajorService.getAdminList(req.query);
    res.status(200).json({ success: true, message: 'Lấy danh sách trường-ngành cho admin thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const getOutdatedMajors = async (req, res, next) => {
  try {
    const result = await universityMajorService.getOutdated(req.query);
    res.status(200).json({ success: true, message: 'Lấy danh sách thiếu điểm chuẩn thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const updateMajorScore = async (req, res, next) => {
  try {
    const data = await universityMajorService.updateScore(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật điểm chuẩn thành công', data });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateScores = async (req, res, next) => {
  try {
    const data = await universityMajorService.bulkUpdateScores(req.body.updates);
    res.status(200).json({ success: true, message: 'Cập nhật điểm chuẩn hàng loạt thành công', data });
  } catch (error) {
    next(error);
  }
};

export const scrapeAndUpdateScores = (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng scrape điểm chuẩn chưa được triển khai',
  });
};

export const fetchAdmissionScoresWithAI = (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng lấy điểm chuẩn bằng AI chưa được triển khai',
  });
};
