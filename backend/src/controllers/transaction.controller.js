import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';

// ─── Create Transaction ───────────────────────────────────────────────────────
export const createTransaction = async (req, res, next) => {
  try {
    const { product: productId, type, quantity, note } = req.body;

    // Find the product
    const product = await Product.findById(productId);
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
      product: productId,
      type,
      quantity,
      previousStock,
      newStock,
      note: note || '',
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
    const transactions = await Transaction.find()
      .populate('product', 'name category unit price')
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
