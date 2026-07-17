import mongoose from 'mongoose';

const whatsappIdentitySchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true, unique: true },
  phoneNumber: { type: String, trim: true, unique: true, sparse: true },
  displayName: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['PENDING', 'LINKED', 'DISABLED'], default: 'PENDING' },
  lowStockAlertsEnabled: { type: Boolean, default: true },
  linkedAt: { type: Date, default: null },
}, { timestamps: true });

whatsappIdentitySchema.index({ shop: 1, status: 1 });

export default mongoose.model('WhatsAppIdentity', whatsappIdentitySchema);
