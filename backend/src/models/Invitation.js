import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    role: { type: String, enum: ["MANAGER", "WORKER"], default: "WORKER" },
    codeHash: { type: String, required: true, unique: true, select: false },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "CANCELLED"], default: "PENDING" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

invitationSchema.index({ shop: 1, email: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Invitation", invitationSchema);
