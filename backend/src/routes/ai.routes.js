import { Router } from "express";

import { chat, getInsights } from "../controllers/ai.controller.js";

const router = Router();

router.post("/chat", chat);
router.get("/insights", getInsights);

export default router;
