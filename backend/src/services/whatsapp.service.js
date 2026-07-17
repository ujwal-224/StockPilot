import crypto from 'node:crypto';
import WhatsAppMessage from '../models/WhatsAppMessage.js';

const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !rawBody || !signature?.startsWith('sha256=')) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

async function send(payload, recipient) {
  if (!isWhatsAppConfigured()) throw new Error('WhatsApp Cloud API is not configured');
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: recipient, ...payload }),
    signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || `WhatsApp API returned ${response.status}`);
  const messageId = result.messages?.[0]?.id;
  if (messageId) await WhatsAppMessage.create({ messageId, phoneNumber: recipient, direction: 'OUTBOUND', status: 'SENT' }).catch(() => {});
  return result;
}

export const sendTextMessage = (recipient, text) => send({ type: 'text', text: { preview_url: false, body: text.slice(0, 4096) } }, recipient);

export const sendLowStockTemplate = (recipient, product) => {
  const templateName = process.env.WHATSAPP_LOW_STOCK_TEMPLATE;
  if (!templateName) throw new Error('WHATSAPP_LOW_STOCK_TEMPLATE is not configured');
  return send({
    type: 'template',
    template: {
      name: templateName,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US' },
      components: [{
        type: 'body',
        parameters: [product.name, `${product.stock} ${product.unit}`, `${product.threshold} ${product.unit}`]
          .map((text) => ({ type: 'text', text: String(text) })),
      }],
    },
  }, recipient);
};
