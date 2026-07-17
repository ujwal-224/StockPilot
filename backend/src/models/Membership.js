import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    role: { type: String, enum: ["OWNER", "MANAGER", "WORKER"], required: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

membershipSchema.index({ user: 1, shop: 1 }, { unique: true });
membershipSchema.index({ shop: 1, status: 1 });

export default mongoose.model("Membership", membershipSchema);
