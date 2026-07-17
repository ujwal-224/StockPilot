import { Router } from "express";
import { getShopProfile, updateShopProfile } from "../controllers/shop.controller.js";
import { authenticate, allowRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/profile", getShopProfile);
router.put("/profile", allowRoles("OWNER"), updateShopProfile);

export default router;
