import mongoose from 'mongoose';

const whatsappMessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
  status: { type: String, default: 'RECEIVED' },
}, { timestamps: true });

whatsappMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('WhatsAppMessage', whatsappMessageSchema);
