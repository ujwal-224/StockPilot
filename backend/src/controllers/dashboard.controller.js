import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';

export const getDashboardData = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const lowStockFilter = { shop: req.auth.shopId, $expr: { $lte: ['$stock', '$threshold'] } };
    const [totalProducts, lowStockCount, todayTransactions, lowStockProducts, recentTransactions] = await Promise.all([
      Product.countDocuments({ shop: req.auth.shopId }),
      Product.countDocuments(lowStockFilter),
      Transaction.countDocuments({ shop: req.auth.shopId, createdAt: { $gte: startOfToday } }),
      Product.find(lowStockFilter).sort({ stock: 1 }).limit(5).lean(),
      Transaction.find({ shop: req.auth.shopId }).populate('product', 'name unit').sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        todayTransactions,
        lowStockProducts,
        recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};
