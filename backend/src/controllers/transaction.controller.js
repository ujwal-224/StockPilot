import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

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

export const createTransaction = async (req, res, next) => {
  let session;
  try {
    session = await mongoose.startSession();
    if (!mongoose.isValidObjectId(req.body.product)) {
      return res.status(400).json({ success: false, message: 'A valid product is required' });
    }

    const { type, quantity, note } = parseTransactionInput(req.body);
    let responseData;

    await session.withTransaction(async () => {
      const filter = { _id: req.body.product, shop: req.auth.shopId };
      let update;
      if (type === 'SALE') {
        filter.stock = { $gte: quantity };
        update = { $inc: { stock: -quantity } };
      } else if (type === 'PURCHASE') {
        update = { $inc: { stock: quantity } };
      } else {
        update = { $set: { stock: quantity } };
      }

      const previousProduct = await Product.findOneAndUpdate(filter, update, {
        new: false,
        runValidators: true,
        session,
      });

      if (!previousProduct) {
        const exists = await Product.exists({ _id: req.body.product, shop: req.auth.shopId }).session(session);
        const error = new Error(exists && type === 'SALE' ? 'Insufficient stock' : 'Product not found');
        error.statusCode = exists ? 400 : 404;
        throw error;
      }

      const newStock = type === 'SALE'
        ? previousProduct.stock - quantity
        : type === 'PURCHASE'
          ? previousProduct.stock + quantity
          : quantity;

      const [transaction] = await Transaction.create([{
        shop: req.auth.shopId,
        performedBy: req.auth.userId,
        product: previousProduct._id,
        type,
        quantity,
        unitPrice: previousProduct.price,
        productSnapshot: {
          name: previousProduct.name,
          category: previousProduct.category,
          unit: previousProduct.unit,
        },
        previousStock: previousProduct.stock,
        newStock,
        note,
      }], { session });

      await AuditLog.create([{
        shop: req.auth.shopId,
        user: req.auth.userId,
        action: 'STOCK_UPDATED',
        resourceType: 'TRANSACTION',
        resourceId: transaction._id,
        before: { stock: previousProduct.stock },
        after: { stock: newStock, type, quantity },
      }], { session });

      responseData = {
        transaction,
        product: { ...previousProduct.toObject(), stock: newStock },
      };
    });

    return res.status(201).json({ success: true, message: 'Transaction recorded successfully', data: responseData });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
  }
};

export const getAllTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const filter = { shop: req.auth.shopId };
    const [transactions, total, counts] = await Promise.all([
      Transaction.find(filter)
        .select('-__v')
        .populate('product', 'name category unit price')
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: { shop: new mongoose.Types.ObjectId(req.auth.shopId) } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      counts: Object.fromEntries(counts.map((item) => [item._id, item.count])),
      data: transactions,
    });
  } catch (error) {
    return next(error);
  }
};
