import express from 'express';
import { compareMajors } from '../controllers/majorComparisonController.js';

const router = express.Router();

router.get('/', compareMajors);

export default router;
