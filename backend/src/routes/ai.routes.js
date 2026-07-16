import { Router } from "express";

import { chat, getInsights } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.post("/chat", chat);
router.get("/insights", getInsights);

export default router;
