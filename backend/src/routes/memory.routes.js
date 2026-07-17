import { Router } from "express";

import { getMemories, removeMemory } from "../controllers/memory.controller.js";
import { authenticate, allowRoles } from "../middleware/auth.middleware.js";

const router = Router();

// All memory routes require authentication
router.use(authenticate);

// Only OWNER and MANAGER can view and manage business memories
router.get("/", allowRoles("OWNER", "MANAGER"), getMemories);
router.delete("/:id", allowRoles("OWNER", "MANAGER"), removeMemory);

export default router;
