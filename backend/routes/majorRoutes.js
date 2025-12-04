import express from 'express';
import { getFilteredMajors, getMajorDetail } from '../controllers/majorController.js';

const router = express.Router();

router.get('/', getFilteredMajors);

router.get('/:universityCode/:majorCode', getMajorDetail);

export default router;