import express from 'express';
import {
  createUniversity,
  deleteUniversity,
  getAllUniversities,
  getProvinces,
  getUniversityById,
  getUniversityByIdInternal,
  importUniversitiesFromExcel,
  updateUniversity,
} from '../controllers/universityController.js';
import { checkAdminOrUniManager, checkAdminRole, verifyToken } from '../middlewares/auth.js';
import { verifyInternalRequest } from '../middlewares/internalAuth.js';
import { uploadExcelFile } from '../middlewares/upload.js';
import { validateObjectIdParam } from '../middlewares/validators.js';

const router = express.Router();

router.post('/import/excel', verifyToken, checkAdminRole, uploadExcelFile, importUniversitiesFromExcel);
router.get('/internal/:id', verifyInternalRequest, validateObjectIdParam('id'), getUniversityByIdInternal);
router.get('/provinces', getProvinces);

router.post('/', verifyToken, checkAdminRole, createUniversity);
router.get('/', getAllUniversities);
router.get('/:id', validateObjectIdParam('id'), getUniversityById);
router.put('/:id', verifyToken, checkAdminOrUniManager, validateObjectIdParam('id'), updateUniversity);
router.delete('/:id', verifyToken, checkAdminRole, validateObjectIdParam('id'), deleteUniversity);

export default router;
