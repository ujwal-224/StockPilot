import crypto from 'node:crypto';
import WhatsAppIdentity from '../models/WhatsAppIdentity.js';
import WhatsAppLinkCode from '../models/WhatsAppLinkCode.js';
import WhatsAppMessage from '../models/WhatsAppMessage.js';
import { handleWhatsAppCommand } from '../services/whatsapp-command.service.js';
import {
  createTwilioReply, isWhatsAppConfigured, sendTextMessage,
  verifyTwilioSignature, verifyWebhookSignature,
} from '../services/whatsapp.service.js';

const hashCode = (code) => crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');

export const getWhatsAppStatus = async (req, res, next) => {
  try {
    const identity = await WhatsAppIdentity.findOne({ membership: req.auth.membershipId }).lean();
    return res.json({
      success: true,
      data: {
        configured: isWhatsAppConfigured(),
        businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER?.replace('whatsapp:', '') || '',
        linked: identity?.status === 'LINKED',
        phoneNumber: identity?.phoneNumber || '',
        lowStockAlertsEnabled: identity?.lowStockAlertsEnabled ?? true,
        linkedAt: identity?.linkedAt || null,
      },
    });
  } catch (error) { return next(error); }
};

export const createLinkCode = async (req, res, next) => {
  try {
    const code = `SP-${crypto.randomInt(100000, 1000000)}`;
    await WhatsAppLinkCode.deleteMany({ membership: req.auth.membershipId });
    await WhatsAppLinkCode.create({
      shop: req.auth.shopId,
      membership: req.auth.membershipId,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
    await WhatsAppIdentity.findOneAndUpdate(
      { membership: req.auth.membershipId },
      { shop: req.auth.shopId, membership: req.auth.membershipId, status: 'PENDING' },
      { upsert: true, new: true },
    );
    return res.status(201).json({ success: true, data: { code, expiresAt: new Date(Date.now() + 10 * 60_000), businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER?.replace('whatsapp:', '') || '' } });
  } catch (error) { return next(error); }
};

export const updateWhatsAppSettings = async (req, res, next) => {
  try {
    const identity = await WhatsAppIdentity.findOneAndUpdate(
      { membership: req.auth.membershipId },
      { lowStockAlertsEnabled: Boolean(req.body.lowStockAlertsEnabled) },
      { new: true },
    );
    if (!identity) return res.status(404).json({ success: false, message: 'WhatsApp is not linked' });
    return res.json({ success: true, data: { lowStockAlertsEnabled: identity.lowStockAlertsEnabled } });
  } catch (error) { return next(error); }
};

export const disconnectWhatsApp = async (req, res, next) => {
  try {
    await Promise.all([
      WhatsAppIdentity.deleteOne({ membership: req.auth.membershipId }),
      WhatsAppLinkCode.deleteMany({ membership: req.auth.membershipId }),
    ]);
    return res.json({ success: true, message: 'WhatsApp disconnected' });
  } catch (error) { return next(error); }
};

export const verifyWhatsAppWebhook = (req, res) => {
  const valid = req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN;
  return valid ? res.status(200).send(req.query['hub.challenge']) : res.sendStatus(403);
};

async function processInboundMessage(message, contact) {
  if (message.type !== 'text' || !message.text?.body) {
    await sendTextMessage(message.from, 'StockPilot currently accepts text commands only. Send HELP to see commands.');
    return;
  }
  const reply = await handleWhatsAppCommand({
    phoneNumber: message.from,
    displayName: contact?.profile?.name || '',
    text: message.text.body,
    hashLinkCode: hashCode,
  });
  await sendTextMessage(message.from, reply);
}

export const receiveWhatsAppWebhook = async (req, res) => {
  if (!verifyWebhookSignature(req.rawBody, req.headers['x-hub-signature-256'])) return res.sendStatus(401);
  const changes = (req.body.entry || []).flatMap((entry) => entry.changes || []);
  for (const change of changes) {
    const value = change.value || {};
    for (const status of value.statuses || []) {
      WhatsAppMessage.updateOne({ messageId: status.id }, { status: String(status.status || '').toUpperCase() }).catch(console.error);
    }
    for (const message of value.messages || []) {
      WhatsAppMessage.create({ messageId: message.id, phoneNumber: message.from, direction: 'INBOUND' })
        .then(() => processInboundMessage(message, value.contacts?.[0]))
        .catch((error) => { if (error.code !== 11000) console.error(error); });
    }
  }
  return res.sendStatus(200);
};

export const receiveTwilioWebhook = async (req, res) => {
  const webhookUrl = process.env.TWILIO_WEBHOOK_URL || `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  if (!verifyTwilioSignature(webhookUrl, req.body, req.headers['x-twilio-signature'])) return res.sendStatus(403);

  const messageId = String(req.body.MessageSid || '');
  const phoneNumber = String(req.body.From || '').replace(/^whatsapp:\+?/, '').replace(/\D/g, '');
  const text = String(req.body.Body || '');
  if (!messageId || !phoneNumber) return res.status(400).type('text/xml').send(createTwilioReply('Invalid WhatsApp message.'));

  try {
    await WhatsAppMessage.create({ messageId, phoneNumber, direction: 'INBOUND' });
  } catch (error) {
    if (error.code === 11000) return res.status(200).type('text/xml').send(createTwilioReply(''));
    console.error('Unable to record Twilio WhatsApp message:', error);
    return res.status(200).type('text/xml').send(createTwilioReply('StockPilot is temporarily unavailable. Please try again.'));
  }

  try {
    const reply = await handleWhatsAppCommand({
      phoneNumber,
      displayName: String(req.body.ProfileName || ''),
      text,
      hashLinkCode: hashCode,
    });
    return res.status(200).type('text/xml').send(createTwilioReply(reply));
  } catch (error) {
    console.error('Twilio WhatsApp command failed:', error);
    return res.status(200).type('text/xml').send(createTwilioReply('StockPilot could not process that message. Please try again.'));
  }
};
