import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';
import OutboxEvent from '../models/OutboxEvent.js';

const TYPES = new Set(['SALE', 'PURCHASE', 'ADJUSTMENT']);

export function parseTransactionInput(body) {
  const type = String(body.type || '').toUpperCase();
  const quantity = Number(body.quantity);
  if (!TYPES.has(type)) {
    const error = new Error('Transaction type must be SALE, PURCHASE, or ADJUSTMENT');
    error.statusCode = 400;
    throw error;
  }
  const minimum = type === 'ADJUSTMENT' ? 0 : Number.EPSILON;
  if (!Number.isFinite(quantity) || quantity < minimum) {
    const error = new Error(type === 'ADJUSTMENT' ? 'Adjusted stock must be zero or greater' : 'Quantity must be greater than zero');
    error.statusCode = 400;
    throw error;
  }
  return { type, quantity, note: typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '' };
}

export async function recordInventoryTransaction({ shopId, userId, productId, type, quantity, note = '' }) {
  if (!mongoose.isValidObjectId(productId)) {
    const error = new Error('A valid product is required');
    error.statusCode = 400;
    throw error;
  }
  const input = parseTransactionInput({ type, quantity, note });
  const session = await mongoose.startSession();
  let responseData;
  try {
    await session.withTransaction(async () => {
      const filter = { _id: productId, shop: shopId };
      let update;
      if (input.type === 'SALE') {
        filter.stock = { $gte: input.quantity };
        update = { $inc: { stock: -input.quantity } };
      } else if (input.type === 'PURCHASE') {
        update = { $inc: { stock: input.quantity } };
      } else {
        update = { $set: { stock: input.quantity } };
      }

      const previousProduct = await Product.findOneAndUpdate(filter, update, { new: false, runValidators: true, session });
      if (!previousProduct) {
        const exists = await Product.exists({ _id: productId, shop: shopId }).session(session);
        const error = new Error(exists && input.type === 'SALE' ? 'Insufficient stock' : 'Product not found');
        error.statusCode = exists ? 400 : 404;
        throw error;
      }

      const newStock = input.type === 'SALE' ? previousProduct.stock - input.quantity
        : input.type === 'PURCHASE' ? previousProduct.stock + input.quantity : input.quantity;
      const [transaction] = await Transaction.create([{
        shop: shopId, performedBy: userId, product: previousProduct._id,
        type: input.type, quantity: input.quantity, unitPrice: previousProduct.price,
        productSnapshot: { name: previousProduct.name, category: previousProduct.category, unit: previousProduct.unit },
        previousStock: previousProduct.stock, newStock, note: input.note,
      }], { session });
      await AuditLog.create([{
        shop: shopId, user: userId, action: 'STOCK_UPDATED', resourceType: 'TRANSACTION', resourceId: transaction._id,
        before: { stock: previousProduct.stock }, after: { stock: newStock, type: input.type, quantity: input.quantity },
      }], { session });

      const crossedThreshold = previousProduct.stock > previousProduct.threshold && newStock <= previousProduct.threshold;
      if (crossedThreshold) {
        await OutboxEvent.create([{
          type: 'WHATSAPP_LOW_STOCK', shop: shopId,
          payload: { productId: previousProduct._id, name: previousProduct.name, stock: newStock, threshold: previousProduct.threshold, unit: previousProduct.unit },
        }], { session });
      }
      responseData = { transaction, product: { ...previousProduct.toObject(), stock: newStock } };
    });
    return responseData;
  } finally {
    await session.endSession();
  }
}
