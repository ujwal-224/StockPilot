import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { parseTransactionInput, recordInventoryTransaction } from '../services/inventory.service.js';

export { parseTransactionInput };

export const createTransaction = async (req, res, next) => {
  try {
    const { type, quantity, note } = parseTransactionInput(req.body);
    const responseData = await recordInventoryTransaction({
      shopId: req.auth.shopId,
      userId: req.auth.userId,
      productId: req.body.product,
      type,
      quantity,
      note,
    });
    return res.status(201).json({ success: true, message: 'Transaction recorded successfully', data: responseData });
  } catch (error) {
    return next(error);
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
