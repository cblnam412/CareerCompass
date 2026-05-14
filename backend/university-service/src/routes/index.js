import express from 'express';
import affiliationRoutes from './affiliationRoutes.js';
import majorRoutes from './majorRoutes.js';
import universityMajorRoutes from './universityMajorRoutes.js';
import universityRoutes from './universityRoutes.js';

const router = express.Router();

router.use('/majors', majorRoutes);
router.use('/university-majors', universityMajorRoutes);
router.use('/affiliations', affiliationRoutes);
router.use('/', universityRoutes);

export default router;
