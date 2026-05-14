import universityMajorService from '../services/universityMajorService.js';

export const getAllUniversityMajors = async (req, res, next) => {
  try {
    const result = await universityMajorService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lấy danh sách trường-ngành thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const getUniversityMajorById = async (req, res, next) => {
  try {
    const data = await universityMajorService.getById(req.params.id);
    res.status(200).json({ success: true, message: 'Lấy chi tiết trường-ngành thành công', data });
  } catch (error) {
    next(error);
  }
};

export const getMajorsByUniversity = async (req, res, next) => {
  try {
    const result = await universityMajorService.getByUniversity(req.params.universityId, req.query);
    res.status(200).json({ success: true, message: 'Lấy ngành theo trường thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const createUniversityMajor = async (req, res, next) => {
  try {
    const data = await universityMajorService.create(req.body);
    res.status(201).json({ success: true, message: 'Tạo quan hệ trường-ngành thành công', data });
  } catch (error) {
    next(error);
  }
};

export const updateUniversityMajor = async (req, res, next) => {
  try {
    const data = await universityMajorService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật quan hệ trường-ngành thành công', data });
  } catch (error) {
    next(error);
  }
};

export const deleteUniversityMajor = async (req, res, next) => {
  try {
    await universityMajorService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa quan hệ trường-ngành thành công' });
  } catch (error) {
    next(error);
  }
};

export const importFromExcel = async (req, res, next) => {
  try {
    const results = await universityMajorService.importFromExcel(req.file.path, req.excelData || []);
    res.status(201).json({ success: true, message: 'Import dữ liệu trường-ngành thành công', results });
  } catch (error) {
    next(error);
  }
};
