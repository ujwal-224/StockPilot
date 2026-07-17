import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

// ─── Create Transaction ───────────────────────────────────────────────────────
export const createTransaction = async (req, res, next) => {
  try {
    const { product: productId, type, quantity, note } = req.body;

    // Find the product
    const product = await Product.findOne({ _id: productId, shop: req.auth.shopId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.stock;
    let newStock;

    if (type === 'SALE') {
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
        });
      }
      newStock = product.stock - quantity;
    } else if (type === 'PURCHASE') {
      newStock = product.stock + quantity;
    } else if (type === 'ADJUSTMENT') {
      newStock = quantity;
    }

    // Update product stock
    product.stock = newStock;
    await product.save();

    // Save transaction record
    const transaction = await Transaction.create({
      shop: req.auth.shopId,
      performedBy: req.auth.userId,
      product: productId,
      type,
      quantity,
      previousStock,
      newStock,
      note: note || '',
    });

    await AuditLog.create({
      shop: req.auth.shopId, user: req.auth.userId, action: 'STOCK_UPDATED',
      resourceType: 'TRANSACTION', resourceId: transaction._id,
      before: { stock: previousStock }, after: { stock: newStock, type, quantity },
    });

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: {
        transaction,
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Transactions ─────────────────────────────────────────────────────
export const getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ shop: req.auth.shopId })
      .populate('product', 'name category unit price')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};
