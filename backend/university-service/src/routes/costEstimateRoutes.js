import express from 'express';
import { estimateUniversityCost } from '../controllers/costEstimateController.js';

const router = express.Router();

router.post('/', estimateUniversityCost);

export default router;
