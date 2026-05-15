import subjectCombinationService from '../services/subjectCombinationService.js';

export const createSubjectCombination = async (req, res, next) => {
  try {
    const data = await subjectCombinationService.create(req.body);
    res.status(201).json({ success: true, message: 'Tao to hop mon thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const getAllSubjectCombinations = async (req, res, next) => {
  try {
    const result = await subjectCombinationService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lay danh sach to hop mon thanh cong', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSubjectCombinationById = async (req, res, next) => {
  try {
    const data = await subjectCombinationService.getById(req.params.id);
    res.status(200).json({ success: true, message: 'Lay to hop mon thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const updateSubjectCombination = async (req, res, next) => {
  try {
    const data = await subjectCombinationService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cap nhat to hop mon thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const deleteSubjectCombination = async (req, res, next) => {
  try {
    await subjectCombinationService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Xoa to hop mon thanh cong' });
  } catch (error) {
    next(error);
  }
};
