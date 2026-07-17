import mongoose from 'mongoose';

const whatsappLinkCodeSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true, index: true },
  codeHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

whatsappLinkCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('WhatsAppLinkCode', whatsappLinkCodeSchema);
