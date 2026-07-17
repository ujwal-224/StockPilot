import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: String, trim: true },
    businessType: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    pincode: { type: String, trim: true },
    currency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    preferredLanguage: { type: String, default: "English" },
    shopLogo: { type: String }, // Stores base64 Data URL or path
    profileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Shop", shopSchema);
