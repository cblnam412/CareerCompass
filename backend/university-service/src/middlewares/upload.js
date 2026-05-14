import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { mapUniversityMajorRows } from '../utils/excelParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/tmp');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (extensions) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!extensions.includes(ext)) {
    return cb(new Error(`Chỉ hỗ trợ file ${extensions.join(', ')}`));
  }
  cb(null, true);
};

const excelUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: fileFilter(['.xlsx', '.xls']),
});

const txtUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(['.txt']),
});

export const uploadExcelFile = excelUpload.single('file');
export const uploadTxtFile = txtUpload.single('file');

export const parseExcelData = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng tải lên file Excel',
    });
  }

  try {
    req.excelData = mapUniversityMajorRows(req.file.path);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Không thể đọc file Excel',
      error: error.message,
    });
  }
};
