import { Router } from 'express';
import { getAnalyticsData } from '../controllers/analytics.controller.js';

const router = Router();

// GET /api/analytics
router.get('/', getAnalyticsData);

export default router;
