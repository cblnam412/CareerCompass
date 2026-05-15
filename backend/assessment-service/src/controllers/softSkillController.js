import softSkillService from '../services/softSkillService.js';

export const getAllSoftSkills = async (req, res, next) => {
  try {
    const result = await softSkillService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lay danh sach ky nang mem thanh cong', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSoftSkillById = async (req, res, next) => {
  try {
    const data = await softSkillService.getById(req.params.id);
    res.status(200).json({ success: true, message: 'Lay ky nang mem thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const createSoftSkill = async (req, res, next) => {
  try {
    const data = await softSkillService.create(req.body);
    res.status(201).json({ success: true, message: 'Tao ky nang mem thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const updateSoftSkill = async (req, res, next) => {
  try {
    const data = await softSkillService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cap nhat ky nang mem thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const deleteSoftSkill = async (req, res, next) => {
  try {
    const data = await softSkillService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Xoa ky nang mem thanh cong', data });
  } catch (error) {
    next(error);
  }
};
