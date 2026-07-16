import { Router } from 'express';
import { getAnalyticsData } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/analytics
router.get('/', authenticate, getAnalyticsData);

export default router;
