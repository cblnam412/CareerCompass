import universityService from '../services/universityService.js';

export const createUniversity = async (req, res, next) => {
  try {
    const data = await universityService.create(req.body);
    res.status(201).json({ success: true, message: 'Tạo trường đại học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const importUniversitiesFromExcel = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng tải lên file Excel' });
    const result = await universityService.importFromExcel(req.file.path);
    res.status(201).json({ success: true, message: 'Import trường đại học thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const getAllUniversities = async (req, res, next) => {
  try {
    const result = await universityService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lấy danh sách trường thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const getUniversityById = async (req, res, next) => {
  try {
    const data = await universityService.getById(req.params.id);
    res.status(200).json({ success: true, message: 'Lấy thông tin trường thành công', data });
  } catch (error) {
    next(error);
  }
};

export const updateUniversity = async (req, res, next) => {
  try {
    const data = await universityService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật trường đại học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const deleteUniversity = async (req, res, next) => {
  try {
    await universityService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa trường đại học thành công' });
  } catch (error) {
    next(error);
  }
};

export const getProvinces = (req, res, next) => {
  try {
    const data = universityService.getProvinces();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};
