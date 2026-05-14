import majorService from '../services/majorService.js';

export const createMajor = async (req, res, next) => {
  try {
    const data = await majorService.create(req.body);
    res.status(201).json({ success: true, message: 'Tạo ngành học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const createMajorsFromFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng tải lên file TXT' });
    const result = await majorService.bulkUpload(req.file.path);
    res.status(201).json({ success: true, message: `Tạo ${result.count} ngành học thành công`, ...result });
  } catch (error) {
    next(error);
  }
};

export const updateMajor = async (req, res, next) => {
  try {
    const data = await majorService.update(req.params.majorId, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật ngành học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const deleteMajor = async (req, res, next) => {
  try {
    const data = await majorService.delete(req.params.majorId);
    res.status(200).json({ success: true, message: 'Xóa ngành học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const deleteMajors = async (req, res, next) => {
  try {
    const result = await majorService.deleteMany(req.body.majorIds);
    res.status(200).json({ success: true, message: `Đã xóa ${result.deletedCount} ngành học`, deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
};

export const getAllMajors = async (req, res, next) => {
  try {
    const result = await majorService.getAll(req.query);
    res.status(200).json({ success: true, message: 'Lấy danh sách ngành học thành công', ...result });
  } catch (error) {
    next(error);
  }
};

export const getMajorById = async (req, res, next) => {
  try {
    const data = await majorService.getById(req.params.majorId);
    res.status(200).json({ success: true, message: 'Lấy ngành học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const searchMajors = async (req, res, next) => {
  try {
    const data = await majorService.search(req.query.keyword);
    res.status(200).json({ success: true, message: 'Tìm kiếm ngành học thành công', count: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const getMajorsByCategory = async (req, res, next) => {
  try {
    const data = await majorService.getByCategory(req.params.category);
    res.status(200).json({ success: true, message: 'Lấy ngành học theo nhóm thành công', count: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const getAllCategories = async (req, res, next) => {
  try {
    const data = await majorService.getCategories();
    res.status(200).json({ success: true, message: 'Lấy nhóm ngành thành công', count: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const getMajorStats = async (req, res, next) => {
  try {
    const data = await majorService.getStats();
    res.status(200).json({ success: true, message: 'Lấy thống kê ngành học thành công', data });
  } catch (error) {
    next(error);
  }
};

export const exportMajorsToCSV = async (req, res, next) => {
  try {
    const csv = await majorService.exportCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=majors_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
