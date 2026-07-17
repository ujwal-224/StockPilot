import { Router } from "express";
import { signup, signin, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, key: (req) => `auth:${req.ip}` });
router.post("/signup", authLimiter, signup);
router.post("/signin", authLimiter, signin);
router.get("/me", authenticate, me);
export default router;
