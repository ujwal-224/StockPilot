import crypto from "node:crypto";
import Membership from "../models/Membership.js";
import Invitation from "../models/Invitation.js";
import AuditLog from "../models/AuditLog.js";

const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");

export const getTeam = async (req, res, next) => {
  try {
    const [members, invitations] = await Promise.all([
      Membership.find({ shop: req.auth.shopId }).populate("user", "name email").sort({ createdAt: 1 }),
      Invitation.find({ shop: req.auth.shopId, status: "PENDING", expiresAt: { $gt: new Date() } })
        .select("email role expiresAt createdAt")
        .sort({ createdAt: -1 }),
    ]);

    return res.json({ success: true, data: { members, invitations } });
  } catch (error) {
    return next(error);
  }
};

export const inviteWorker = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = req.body.role === "MANAGER" ? "MANAGER" : "WORKER";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "A valid worker email is required" });
    }

    await Invitation.updateMany(
      { shop: req.auth.shopId, email, status: "PENDING" },
      { $set: { status: "CANCELLED" } }
    );

    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const invitation = await Invitation.create({
      shop: req.auth.shopId,
      email,
      role,
      codeHash: hashCode(code),
      invitedBy: req.auth.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return res.status(201).json({
      success: true,
      message: "Invitation created",
      data: { id: invitation._id, email, role, code, expiresAt: invitation.expiresAt },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const member = await Membership.findOne({ _id: req.params.id, shop: req.auth.shopId });
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });
    if (member.role === "OWNER") {
      return res.status(400).json({ success: false, message: "The shop owner cannot be changed here" });
    }

    if (req.body.role) member.role = req.body.role === "MANAGER" ? "MANAGER" : "WORKER";
    if (req.body.status) member.status = req.body.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    await member.save();
    return res.json({ success: true, data: member });
  } catch (error) {
    return next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ shop: req.auth.shopId })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ success: true, data: logs });
  } catch (error) {
    return next(error);
  }
};
