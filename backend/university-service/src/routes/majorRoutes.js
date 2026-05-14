import express from 'express';
import {
  createMajor,
  createMajorsFromFile,
  deleteMajor,
  deleteMajors,
  exportMajorsToCSV,
  getAllCategories,
  getAllMajors,
  getMajorById,
  getMajorStats,
  getMajorsByCategory,
  searchMajors,
  updateMajor,
} from '../controllers/majorController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';
import { uploadTxtFile } from '../middlewares/upload.js';
import { validateMajorData, validateObjectIdParam, validateSearchParams } from '../middlewares/validators.js';

const router = express.Router();

router.post('/create', verifyToken, checkAdminRole, validateMajorData, createMajor);
router.post('/bulk-upload', verifyToken, checkAdminRole, uploadTxtFile, createMajorsFromFile);
router.delete('/', verifyToken, checkAdminRole, deleteMajors);
router.get('/export/csv', verifyToken, checkAdminRole, exportMajorsToCSV);

router.get('/', validateSearchParams, getAllMajors);
router.get('/search', searchMajors);
router.get('/category/:category', getMajorsByCategory);
router.get('/id/:majorId', validateObjectIdParam('majorId'), getMajorById);
router.get('/categories', getAllCategories);
router.get('/stats', getMajorStats);

router.put('/:majorId', verifyToken, checkAdminRole, validateObjectIdParam('majorId'), validateMajorData, updateMajor);
router.delete('/:majorId', verifyToken, checkAdminRole, validateObjectIdParam('majorId'), deleteMajor);

export default router;
