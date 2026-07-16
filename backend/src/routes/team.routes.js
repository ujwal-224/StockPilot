import { Router } from "express";
import { getTeam, inviteWorker, updateMember, getAuditLogs } from "../controllers/team.controller.js";
import { authenticate, allowRoles } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate, allowRoles("OWNER"));
router.get("/", getTeam);
router.post("/invitations", inviteWorker);
router.patch("/members/:id", updateMember);
router.get("/audit-logs", getAuditLogs);
export default router;
