import express from 'express';
import { getAdmissionTimeline } from '../controllers/admissionTimelineController.js';

const router = express.Router();

router.get('/', getAdmissionTimeline);

export default router;
