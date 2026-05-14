import express from 'express';
import {
  bulkUpdateScores,
  fetchAdmissionScoresWithAI,
  getOutdatedMajors,
  getUniversityMajorsForAdmin,
  scrapeAndUpdateScores,
  updateMajorScore,
} from '../controllers/adminUniversityMajorController.js';
import {
  createUniversityMajor,
  deleteUniversityMajor,
  getAllUniversityMajors,
  getMajorsByUniversity,
  getUniversityMajorById,
  importFromExcel,
  updateUniversityMajor,
} from '../controllers/universityMajorController.js';
import { checkAdminRole, verifyToken } from '../middlewares/auth.js';
import { parseExcelData, uploadExcelFile } from '../middlewares/upload.js';
import { validateObjectIdParam } from '../middlewares/validators.js';

const router = express.Router();

router.get('/admin/list', verifyToken, checkAdminRole, getUniversityMajorsForAdmin);
router.get('/admin/outdated', verifyToken, checkAdminRole, getOutdatedMajors);
router.post('/admin/scrape', verifyToken, checkAdminRole, scrapeAndUpdateScores);
router.post('/admin/ai-score', verifyToken, checkAdminRole, fetchAdmissionScoresWithAI);
router.post('/admin/bulk-update', verifyToken, checkAdminRole, bulkUpdateScores);
router.put('/admin/:id/score', verifyToken, checkAdminRole, validateObjectIdParam('id'), updateMajorScore);

router.post('/import/excel', verifyToken, checkAdminRole, uploadExcelFile, parseExcelData, importFromExcel);

router.get('/', getAllUniversityMajors);
router.get('/university/:universityId', validateObjectIdParam('universityId'), getMajorsByUniversity);
router.get('/:id', validateObjectIdParam('id'), getUniversityMajorById);

router.post('/', verifyToken, checkAdminRole, createUniversityMajor);
router.put('/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), updateUniversityMajor);
router.delete('/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), deleteUniversityMajor);

export default router;
