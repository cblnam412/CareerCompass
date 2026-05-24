import subjectService from '../services/subjectService.js';

export const createSubject = async (req, res, next) => {
  try {
    const data = await subjectService.create(req.body);
    res.status(201).json({ success: true, message: 'Tạo môn học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const getAllSubjects = async (req, res, next) => {
  try {
    const result = await subjectService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lấy danh sách môn học thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    const data = await subjectService.getById(req.params.id);
    res.status(200).json({ success: true, message: 'Lấy môn học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const data = await subjectService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật môn học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    await subjectService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa môn học thành công' });
  } catch (error) {
    next(error);
  }
};
