import express from 'express';
import { verifyToken, checkAdminRole} from '../middlewares/authMiddleware.js';
import {
    getAllUniversityMajors,
    getUniversityMajorById,
    getMajorsByUniversity,
    createUniversityMajor,
    updateUniversityMajor,
    deleteUniversityMajor,
    importFromExcel
} from '../controllers/universityMajorController.js';
import {
    scrapeAndUpdateScores,
    getOutdatedMajors,
    updateMajorScore,
    bulkUpdateScores,
    getUniversityMajorsForAdmin,
    fetchAdmissionScoresWithAI
} from '../controllers/adminUniversityMajorController.js';
import { uploadExcelFile } from '../middlewares/uploadMiddleware.js';
import { parseExcelData } from '../middlewares/excelParserMiddleware.js';

const router = express.Router();

router.get('/', getAllUniversityMajors);
router.get('/university/:universityId', getMajorsByUniversity);
router.get('/:id', getUniversityMajorById);

router.post('/', verifyToken, checkAdminRole, createUniversityMajor);
router.put('/:id', verifyToken, checkAdminRole, updateUniversityMajor);
router.delete('/:id', verifyToken, checkAdminRole, deleteUniversityMajor);

router.post('/import/excel', verifyToken, checkAdminRole, uploadExcelFile, parseExcelData, importFromExcel);

router.get('/admin/list', verifyToken, checkAdminRole, getUniversityMajorsForAdmin);
router.get('/admin/outdated', verifyToken, checkAdminRole, getOutdatedMajors);
router.post('/admin/scrape', verifyToken, checkAdminRole, scrapeAndUpdateScores);
router.post('/admin/ai-score', verifyToken, checkAdminRole, fetchAdmissionScoresWithAI);
router.post('/admin/bulk-update', verifyToken, checkAdminRole, bulkUpdateScores);
router.put('/admin/:id/score', verifyToken, checkAdminRole, updateMajorScore);

export default router;
