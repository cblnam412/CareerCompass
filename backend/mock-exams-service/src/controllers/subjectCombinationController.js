import subjectCombinationService from '../services/subjectCombinationService.js';

export const createSubjectCombination = async (req, res, next) => {
  try {
    const data = await subjectCombinationService.create(req.body);
    res.status(201).json({ success: true, message: 'Tạo tổ hợp môn thành công', data });
  } catch (error) {
    next(error);
  }
};

export const getAllSubjectCombinations = async (req, res, next) => {
  try {
    const result = await subjectCombinationService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lấy danh sách tổ hợp môn thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSubjectCombinationById = async (req, res, next) => {
  try {
    const data = await subjectCombinationService.getById(req.params.id);
    res.status(200).json({ success: true, message: 'Lấy tổ hợp môn thành công', data });
  } catch (error) {
    next(error);
  }
};

export const updateSubjectCombination = async (req, res, next) => {
  try {
    const data = await subjectCombinationService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật tổ hợp môn thành công', data });
  } catch (error) {
    next(error);
  }
};

export const deleteSubjectCombination = async (req, res, next) => {
  try {
    await subjectCombinationService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa tổ hợp môn thành công' });
  } catch (error) {
    next(error);
  }
};
