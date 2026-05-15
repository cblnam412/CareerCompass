import express from 'express';
import personalityQuizRoutes from './personalityQuizRoutes.js';
import softSkillRoutes from './softSkillRoutes.js';

const router = express.Router();

router.use(personalityQuizRoutes);
router.use(softSkillRoutes);

export default router;
