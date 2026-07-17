import { Router } from "express";

import { chat, getInsights } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();
router.use(authenticate);
router.use(rateLimit({ windowMs: 60_000, max: 10, key: (req) => `ai:${req.auth.userId}` }));

router.post("/chat", chat);
router.get("/insights", getInsights);

export default router;
