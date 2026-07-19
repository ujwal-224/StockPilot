import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';
import {
  createLinkCode, disconnectWhatsApp, getWhatsAppStatus, receiveWhatsAppWebhook,
  receiveTwilioWebhook, updateWhatsAppSettings, verifyWhatsAppWebhook,
} from '../controllers/whatsapp.controller.js';

const router = Router();
router.get('/webhook', verifyWhatsAppWebhook);
router.post('/webhook', rateLimit({ windowMs: 60_000, max: 500, key: (req) => `wa:${req.ip}` }), receiveWhatsAppWebhook);
router.post('/twilio-webhook', rateLimit({ windowMs: 60_000, max: 500, key: (req) => `twilio:${req.ip}` }), receiveTwilioWebhook);
router.get('/status', authenticate, getWhatsAppStatus);
router.post('/link-code', authenticate, createLinkCode);
router.patch('/settings', authenticate, updateWhatsAppSettings);
router.delete('/connection', authenticate, disconnectWhatsApp);

export default router;
