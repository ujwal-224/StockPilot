import mongoose from 'mongoose';

const outboxEventSchema = new mongoose.Schema({
  type: { type: String, enum: ['WHATSAPP_LOW_STOCK'], required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'], default: 'PENDING', index: true },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now },
  lastError: { type: String, default: '' },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

outboxEventSchema.index({ status: 1, nextAttemptAt: 1 });

export default mongoose.model('OutboxEvent', outboxEventSchema);
