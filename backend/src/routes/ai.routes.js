import { Router } from "express";

import { chat, getInsights, speechToTextChat } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();
router.use(authenticate);
router.use(rateLimit({ windowMs: 60_000, max: 10, key: (req) => `ai:${req.auth.userId}` }));

router.post("/chat", chat);
router.get("/insights", getInsights);

// POST /api/ai/speech-to-text
// Accepts a multipart/form-data request with a single audio file in the
// "audio" field.  The upload middleware validates the MIME type and size
// before the controller transcribes the audio and returns an AI reply.
router.post("/speech-to-text", upload.single("audio"), speechToTextChat);

export default router;
