import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';

export const getDashboardData = async (req, res, next) => {
  try {
    // 1. totalProducts
    const totalProducts = await Product.countDocuments({ shop: req.auth.shopId });

    // 2. lowStockCount
    const lowStockCount = await Product.countDocuments({
      shop: req.auth.shopId,
      $expr: { $lte: ['$stock', '$threshold'] }
    });

    // 3. todayTransactions
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTransactions = await Transaction.countDocuments({
      shop: req.auth.shopId,
      createdAt: { $gte: startOfToday }
    });

    // 4. lowStockProducts (latest 5 where stock <= threshold, sort by stock ascending)
    const lowStockProducts = await Product.find({
      shop: req.auth.shopId,
      $expr: { $lte: ['$stock', '$threshold'] }
    })
      .sort({ stock: 1 })
      .limit(5);

    // 5. recentTransactions (latest 5 transactions, populated product name/unit, sort newest first)
    const recentTransactions = await Transaction.find({ shop: req.auth.shopId })
      .populate('product', 'name unit')
      .sort({ createdAt: -1 })
      .limit(5);

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
