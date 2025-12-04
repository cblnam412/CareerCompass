import express from 'express';
import { getAllUniversities } from '../controllers/universityController.js';

const router = express.Router();

router.get('/', getAllUniversities);

export default router;