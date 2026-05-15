import subjectService from '../services/subjectService.js';

export const createSubject = async (req, res, next) => {
  try {
    const data = await subjectService.create(req.body);
    res.status(201).json({ success: true, message: 'Tao mon hoc thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const getAllSubjects = async (req, res, next) => {
  try {
    const result = await subjectService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lay danh sach mon hoc thanh cong', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    const data = await subjectService.getById(req.params.id);
    res.status(200).json({ success: true, message: 'Lay mon hoc thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const data = await subjectService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cap nhat mon hoc thanh cong', data });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    await subjectService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Xoa mon hoc thanh cong' });
  } catch (error) {
    next(error);
  }
};
