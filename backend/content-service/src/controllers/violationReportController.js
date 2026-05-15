import violationReportService from '../services/violationReportService.js';

const requester = (req) => ({ userId: req.userId, role: req.role });

export const createReport = async (req, res, next) => {
  try {
    const data = await violationReportService.createReport(req.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Bao cao da duoc gui. Cam on ban da giup cai thien cong dong',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReports = async (req, res, next) => {
  try {
    const data = await violationReportService.getMyReports(req.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const data = await violationReportService.getReports(requester(req), req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getReportDetail = async (req, res, next) => {
  try {
    const data = await violationReportService.getReportDetail(requester(req), req.params.reportId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const approveReport = async (req, res, next) => {
  try {
    const data = await violationReportService.approveReport(requester(req), req.params.reportId);
    res.status(200).json({ success: true, message: 'Bao cao da duoc chap nhan', data });
  } catch (error) {
    next(error);
  }
};

export const rejectReport = async (req, res, next) => {
  try {
    const data = await violationReportService.rejectReport(requester(req), req.params.reportId, req.body.reason);
    res.status(200).json({ success: true, message: 'Bao cao da bi tu choi', data });
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (req, res, next) => {
  try {
    const data = await violationReportService.resolveReport(requester(req), req.params.reportId, req.body);
    res.status(200).json({ success: true, message: 'Bao cao da duoc xu ly', data });
  } catch (error) {
    next(error);
  }
};
