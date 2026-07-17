import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';

export const getAnalyticsData = async (req, res, next) => {
  try {
    // Fetch all products and sale transactions populated with product details
    const products = await Product.find({ shop: req.auth.shopId });
    const saleTransactions = await Transaction.find({ shop: req.auth.shopId, type: 'SALE' }).populate('product');

    // 1. weeklySales & 2. dailySales (last 7 days)
    const today = new Date();
    const startOfPast7Days = new Date();
    startOfPast7Days.setDate(today.getDate() - 6);
    startOfPast7Days.setHours(0, 0, 0, 0);

    // Filter weekly sales transactions (last 7 days)
    const weeklyTransactions = saleTransactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate >= startOfPast7Days;
    });

    // Calculate weeklySales totalRevenue
    let weeklyTotalRevenue = 0;
    weeklyTransactions.forEach(tx => {
      if (tx.product) {
        const quantity = tx.quantity || 0;
        const price = tx.product.price || 0;
        weeklyTotalRevenue += quantity * price;
      }
    });

    const weeklySales = {
      totalRevenue: weeklyTotalRevenue,
      changePercentage: 0
    };

    // Calculate dailySales (last 7 days, Mon-Sun or whatever the day name is)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailySalesMap = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dailySalesMap.push({
        day: daysOfWeek[d.getDay()],
        sales: 0,
        dateString: d.toDateString()
      });
    }

    weeklyTransactions.forEach(tx => {
      if (tx.product) {
        const txDateString = new Date(tx.createdAt).toDateString();
        const quantity = tx.quantity || 0;
        const price = tx.product.price || 0;
        const revenue = quantity * price;
        const dayObj = dailySalesMap.find(d => d.dateString === txDateString);
        if (dayObj) {
          dayObj.sales += revenue;
        }
      }
    });

    const dailySales = dailySalesMap.map(({ day, sales }) => ({
      day,
      sales
    }));

    // 3. categorySales (Group SALE revenue by Product.category)
    const categoryMap = {};
    saleTransactions.forEach(tx => {
      if (tx.product && tx.product.category) {
        const category = tx.product.category;
        const quantity = tx.quantity || 0;
        const price = tx.product.price || 0;
        const revenue = quantity * price;
        categoryMap[category] = (categoryMap[category] || 0) + revenue;
      }
    });

    const categorySales = Object.keys(categoryMap).map(category => ({
      category,
      revenue: categoryMap[category]
    }));

    // 4. fastMovingItems (top 5 products with highest quantity sold)
    const productSalesMap = {};
    // Initialize with all products so we cover products with 0 sales as well if needed
    products.forEach(p => {
      productSalesMap[p._id.toString()] = {
        name: p.name || 'Unknown',
        quantitySold: 0,
        price: p.price || 0,
        stock: p.stock || 0
      };
    });

    saleTransactions.forEach(tx => {
      if (tx.product) {
        const prodId = tx.product._id.toString();
        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = {
            name: tx.product.name || 'Unknown',
            quantitySold: 0,
            price: tx.product.price || 0,
            stock: tx.product.stock || 0
          };
        }
        productSalesMap[prodId].quantitySold += tx.quantity || 0;
      }
    });

    const fastMovingItemsAll = Object.values(productSalesMap).map(item => ({
      name: item.name,
      quantitySold: item.quantitySold,
      revenue: item.quantitySold * item.price,
      stock: item.stock
    }));

    const fastMovingItems = fastMovingItemsAll
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        weeklySales,
        dailySales,
        categorySales,
        fastMovingItems
      }
    });
  } catch (error) {
    next(error);
  }
};
