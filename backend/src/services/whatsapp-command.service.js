import Product from '../models/Product.js';
import Membership from '../models/Membership.js';
import WhatsAppIdentity from '../models/WhatsAppIdentity.js';
import WhatsAppLinkCode from '../models/WhatsAppLinkCode.js';
import WhatsAppConversation from '../models/WhatsAppConversation.js';
import { recordInventoryTransaction } from './inventory.service.js';

const HELP = `StockPilot commands:\n• STOCK rice — check stock\n• LOW — low-stock items\n• OUT — out-of-stock items\n• ADD rice 20 — add purchased stock\n• SALE rice 3 — record a sale\n• SET rice 15 — set counted stock\nReply YES to confirm changes.`;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function parseWhatsAppCommand(text) {
  const message = String(text || '').trim();
  const link = message.match(/^LINK\s+([A-Z0-9-]+)$/i);
  if (link) return { action: 'LINK', code: link[1].toUpperCase() };
  if (/^(HELP|HI|HELLO|MENU)$/i.test(message)) return { action: 'HELP' };
  if (/^LOW(?:\s+STOCK)?$/i.test(message)) return { action: 'LOW' };
  if (/^(OUT|OUT\s+OF\s+STOCK)$/i.test(message)) return { action: 'OUT' };
  const stock = message.match(/^STOCK\s+(.+)$/i);
  if (stock) return { action: 'STOCK', query: stock[1].trim() };
  const mutation = message.match(/^(ADD|SALE|SET)\s+(.+?)\s+(\d+(?:\.\d+)?)$/i);
  if (mutation) return { action: mutation[1].toUpperCase(), query: mutation[2].trim(), quantity: Number(mutation[3]) };
  if (/^(YES|CONFIRM)$/i.test(message)) return { action: 'CONFIRM' };
  if (/^(NO|CANCEL)$/i.test(message)) return { action: 'CANCEL' };
  return { action: 'UNKNOWN' };
}

async function findProduct(shopId, query) {
  const exact = await Product.findOne({ shop: shopId, name: { $regex: `^${escapeRegex(query)}$`, $options: 'i' } }).lean();
  if (exact) return { product: exact };
  const matches = await Product.find({ shop: shopId, name: { $regex: escapeRegex(query), $options: 'i' } }).limit(6).lean();
  return matches.length === 1 ? { product: matches[0] } : { matches };
}

async function linkPhone(phoneNumber, displayName, codeHash) {
  const link = await WhatsAppLinkCode.findOne({ codeHash, expiresAt: { $gt: new Date() } }).select('+codeHash');
  if (!link) return 'That linking code is invalid or expired. Generate a new code in StockPilot.';
  await WhatsAppIdentity.findOneAndUpdate(
    { membership: link.membership },
    { shop: link.shop, membership: link.membership, phoneNumber, displayName, status: 'LINKED', linkedAt: new Date() },
    { upsert: true, new: true, runValidators: true },
  );
  await WhatsAppLinkCode.deleteMany({ membership: link.membership });
  return `WhatsApp linked to StockPilot successfully.\n\n${HELP}`;
}

const formatProduct = (product) => `${product.name}\nStock: ${product.stock} ${product.unit}\nThreshold: ${product.threshold} ${product.unit}\nStatus: ${product.stock === 0 ? 'Out of stock' : product.stock <= product.threshold ? 'Low stock' : 'In stock'}`;

export async function handleWhatsAppCommand({ phoneNumber, displayName, text, hashLinkCode }) {
  const command = parseWhatsAppCommand(text);
  if (command.action === 'LINK') return linkPhone(phoneNumber, displayName, hashLinkCode(command.code));

  const identity = await WhatsAppIdentity.findOne({ phoneNumber, status: 'LINKED' }).lean();
  if (!identity) return 'This number is not linked. Open StockPilot → Profile → WhatsApp Integration and generate a linking code.';
  const membership = await Membership.findOne({ _id: identity.membership, shop: identity.shop, status: 'ACTIVE' }).lean();
  if (!membership) return 'Your StockPilot access is inactive. Contact the shop owner.';

  if (command.action === 'HELP' || command.action === 'UNKNOWN') return HELP;
  if (command.action === 'LOW' || command.action === 'OUT') {
    const filter = command.action === 'OUT' ? { stock: 0 } : { $expr: { $lte: ['$stock', '$threshold'] } };
    const products = await Product.find({ shop: identity.shop, ...filter }).sort({ stock: 1 }).limit(20).lean();
    if (!products.length) return command.action === 'OUT' ? 'No products are out of stock.' : 'No products are currently low on stock.';
    return `${command.action === 'OUT' ? 'Out-of-stock' : 'Low-stock'} items:\n${products.map((p, index) => `${index + 1}. ${p.name}: ${p.stock} ${p.unit}`).join('\n')}`;
  }
  if (command.action === 'CANCEL') {
    await WhatsAppConversation.deleteOne({ phoneNumber });
    return 'Pending stock change cancelled.';
  }
  if (command.action === 'CONFIRM') {
    const pending = await WhatsAppConversation.findOne({ phoneNumber, expiresAt: { $gt: new Date() } });
    if (!pending) return 'There is no pending stock change. Send ADD, SALE, or SET first.';
    const result = await recordInventoryTransaction({
      shopId: identity.shop, userId: membership.user, productId: pending.pendingAction.productId,
      type: pending.pendingAction.type, quantity: pending.pendingAction.quantity, note: 'Recorded through WhatsApp',
    });
    await pending.deleteOne();
    return `Confirmed. ${result.product.name} stock is now ${result.product.stock} ${result.product.unit}.`;
  }

  const found = await findProduct(identity.shop, command.query);
  if (!found.product) {
    if (!found.matches?.length) return `No product matched “${command.query}”.`;
    return `Multiple products matched. Please use a more specific name:\n${found.matches.map((p) => `• ${p.name}`).join('\n')}`;
  }
  if (command.action === 'STOCK') return formatProduct(found.product);

  const type = command.action === 'ADD' ? 'PURCHASE' : command.action === 'SALE' ? 'SALE' : 'ADJUSTMENT';
  await WhatsAppConversation.findOneAndUpdate(
    { phoneNumber },
    { shop: identity.shop, membership: identity.membership, pendingAction: { type, productId: found.product._id, quantity: command.quantity }, expiresAt: new Date(Date.now() + 5 * 60_000) },
    { upsert: true, new: true },
  );
  const verb = type === 'PURCHASE' ? 'add' : type === 'SALE' ? 'sell' : 'set the stock to';
  return `Confirm: ${verb} ${command.quantity} ${found.product.unit} ${type === 'ADJUSTMENT' ? 'for' : 'of'} ${found.product.name}?\nReply YES or NO within 5 minutes.`;
}
