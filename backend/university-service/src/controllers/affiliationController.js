import affiliationService from '../services/affiliationService.js';

const requester = (req) => ({ userId: req.userId, role: req.role });

export const getAffiliations = async (req, res, next) => {
  try {
    const result = await affiliationService.list(req.query, requester(req));
    res.status(200).json({ success: true, message: 'Lấy danh sách yêu cầu thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const createAffiliationFromAuth = async (req, res, next) => {
  try {
    const data = await affiliationService.createFromAuth(req.body);
    res.status(201).json({ success: true, message: 'Tạo yêu cầu đại diện trường thành công', data });
  } catch (error) {
    next(error);
  }
};

export const getAffiliationById = async (req, res, next) => {
  try {
    const data = await affiliationService.getById(req.params.id, requester(req));
    res.status(200).json({ success: true, message: 'Lấy chi tiết yêu cầu thành công', data });
  } catch (error) {
    next(error);
  }
};

export const approveAffiliation = async (req, res, next) => {
  try {
    const data = await affiliationService.review(req.params.id, requester(req), 'approved', req.body.reviewNote);
    res.status(200).json({ success: true, message: 'Đã duyệt yêu cầu liên kết trường', data });
  } catch (error) {
    next(error);
  }
};

export const rejectAffiliation = async (req, res, next) => {
  try {
    const data = await affiliationService.review(req.params.id, requester(req), 'rejected', req.body.reviewNote);
    res.status(200).json({ success: true, message: 'Đã từ chối yêu cầu liên kết trường', data });
  } catch (error) {
    next(error);
  }
};

export const getAffiliationsByUniversity = async (req, res, next) => {
  try {
    const result = await affiliationService.listByUniversity(req.params.id, req.query, requester(req));
    res.status(200).json({ success: true, message: 'Lấy yêu cầu theo trường thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const getAffiliationStats = async (req, res, next) => {
  try {
    const data = await affiliationService.stats(requester(req));
    res.status(200).json({ success: true, message: 'Lấy thống kê yêu cầu thành công', data });
  } catch (error) {
    next(error);
  }
};
