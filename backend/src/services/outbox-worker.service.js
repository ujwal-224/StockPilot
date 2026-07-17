import OutboxEvent from '../models/OutboxEvent.js';
import WhatsAppIdentity from '../models/WhatsAppIdentity.js';
import { sendLowStockTemplate } from './whatsapp.service.js';

let running = false;

export async function processOutboxBatch() {
  if (running) return;
  running = true;
  try {
    for (let index = 0; index < 10; index += 1) {
      const event = await OutboxEvent.findOneAndUpdate(
        { status: 'PENDING', nextAttemptAt: { $lte: new Date() } },
        { $set: { status: 'PROCESSING' }, $inc: { attempts: 1 } },
        { new: true, sort: { createdAt: 1 } },
      );
      if (!event) break;
      try {
        const recipients = await WhatsAppIdentity.find({ shop: event.shop, status: 'LINKED', lowStockAlertsEnabled: true }).lean();
        await Promise.all(recipients.map((identity) => sendLowStockTemplate(identity.phoneNumber, event.payload)));
        event.status = 'SENT';
        event.processedAt = new Date();
      } catch (error) {
        event.lastError = String(error.message || error).slice(0, 500);
        event.status = event.attempts >= 5 ? 'FAILED' : 'PENDING';
        event.nextAttemptAt = new Date(Date.now() + Math.min(60, 2 ** event.attempts) * 60_000);
      }
      await event.save();
    }
  } finally {
    running = false;
  }
}

export function startOutboxWorker() {
  const timer = setInterval(() => processOutboxBatch().catch(console.error), 15_000);
  timer.unref();
  processOutboxBatch().catch(console.error);
  return timer;
}
