import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Membership from "../models/Membership.js";
import Invitation from "../models/Invitation.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function publicSession(membership) {
  return {
    user: {
      id: membership.user._id,
      name: membership.user.name,
      email: membership.user.email,
    },
    shop: { id: membership.shop._id, name: membership.shop.name },
    membership: { id: membership._id, role: membership.role },
  };
}

function createToken(membership) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(
    {
      userId: membership.user._id.toString(),
      shopId: membership.shop._id.toString(),
      membershipId: membership._id.toString(),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export const signup = async (req, res, next) => {
  let createdUser;
  let createdShop;
  let createdMembership;

  try {
    const { name, password, shopName, invitationCode } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name?.trim() || !isEmail(email) || typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Name, a valid email, and a password of at least 8 characters are required",
      });
    }

    if (await User.exists({ email })) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    let invitation;
    if (invitationCode) {
      invitation = await Invitation.findOne({
        codeHash: hashCode(String(invitationCode).trim().toUpperCase()),
        email,
        status: "PENDING",
        expiresAt: { $gt: new Date() },
      }).select("+codeHash");

      if (!invitation) {
        return res.status(400).json({ success: false, message: "Invitation code is invalid or expired" });
      }
    } else if (!shopName?.trim()) {
      return res.status(400).json({ success: false, message: "Shop name is required for an owner account" });
    }

    createdUser = await User.create({
      name: name.trim(),
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });

    if (invitation) {
      createdShop = await Shop.findById(invitation.shop);
    } else {
      createdShop = await Shop.create({ name: shopName.trim(), owner: createdUser._id });
    }

    const membership = await Membership.create({
      user: createdUser._id,
      shop: createdShop._id,
      role: invitation?.role || "OWNER",
    });
    createdMembership = membership;

    if (invitation) {
      invitation.status = "ACCEPTED";
      await invitation.save();
    } else if ((await Membership.countDocuments()) === 1) {
      // Preserve the original single-shop demo data during the first owner migration.
      await Product.updateMany({ shop: { $exists: false } }, { $set: { shop: createdShop._id } });
      await Transaction.updateMany(
        { shop: { $exists: false } },
        { $set: { shop: createdShop._id, performedBy: createdUser._id } }
      );
    }

    await membership.populate("user", "name email");
    await membership.populate("shop", "name");

    return res.status(201).json({
      success: true,
      token: createToken(membership),
      ...publicSession(membership),
    });
  } catch (error) {
    if (createdMembership) await Membership.deleteOne({ _id: createdMembership._id });
    if (createdShop && createdShop.owner?.equals(createdUser?._id)) await Shop.deleteOne({ _id: createdShop._id });
    if (createdUser) await User.deleteOne({ _id: createdUser._id });
    return next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const membership = await Membership.findOne({ user: user._id, status: "ACTIVE" })
      .populate("user", "name email")
      .populate("shop", "name");

    if (!membership) {
      return res.status(403).json({ success: false, message: "No active shop membership was found" });
    }

    return res.status(200).json({
      success: true,
      token: createToken(membership),
      ...publicSession(membership),
    });
  } catch (error) {
    return next(error);
  }
};

export const me = (req, res) => res.status(200).json({
  success: true,
  ...publicSession({
    _id: req.auth.membershipId,
    role: req.auth.role,
    user: req.auth.user,
    shop: req.auth.shop,
  }),
});
