import jwt from "jsonwebtoken";
import Membership from "../models/Membership.js";

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "Authentication is not configured" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const membership = await Membership.findOne({
      _id: payload.membershipId,
      user: payload.userId,
      shop: payload.shopId,
      status: "ACTIVE",
    }).populate("user", "name email").populate("shop");

    if (!membership) {
      return res.status(401).json({ success: false, message: "Session is no longer active" });
    }

    req.auth = {
      userId: membership.user._id,
      shopId: membership.shop._id,
      membershipId: membership._id,
      role: membership.role,
      user: membership.user,
      shop: membership.shop,
    };

    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Invalid or expired session" });
    }
    return next(error);
  }
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.auth || !roles.includes(req.auth.role)) {
    return res.status(403).json({ success: false, message: "You do not have permission for this action" });
  }
  return next();
};
