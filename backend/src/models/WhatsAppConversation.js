import mongoose from 'mongoose';

const whatsappConversationSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true },
  pendingAction: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

whatsappConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('WhatsAppConversation', whatsappConversationSchema);
