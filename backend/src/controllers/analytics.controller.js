import Transaction from '../models/Transaction.js';

const TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';
const dateKeyFormatter = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const toDateKey = (date) => Object.fromEntries(dateKeyFormatter.formatToParts(date).map((part) => [part.type, part.value]));

export const getAnalyticsData = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const currentStart = new Date(startOfToday);
    currentStart.setDate(currentStart.getDate() - 6);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);

    const [result] = await Transaction.aggregate([
      { $match: { shop: req.auth.shopId, type: 'SALE' } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'liveProduct',
        },
      },
      { $set: { liveProduct: { $first: '$liveProduct' } } },
      {
        $set: {
          effectivePrice: { $ifNull: ['$unitPrice', { $ifNull: ['$liveProduct.price', 0] }] },
          productName: { $ifNull: ['$productSnapshot.name', { $ifNull: ['$liveProduct.name', 'Deleted Product'] }] },
          productCategory: { $ifNull: ['$productSnapshot.category', { $ifNull: ['$liveProduct.category', 'Uncategorized'] }] },
          productStock: { $ifNull: ['$liveProduct.stock', 0] },
        },
      },
      { $set: { revenue: { $multiply: ['$quantity', '$effectivePrice'] } } },
      {
        $facet: {
          periodTotals: [
            { $match: { createdAt: { $gte: previousStart } } },
            {
              $group: {
                _id: { $cond: [{ $gte: ['$createdAt', currentStart] }, 'current', 'previous'] },
                revenue: { $sum: '$revenue' },
              },
            },
          ],
          dailySales: [
            { $match: { createdAt: { $gte: currentStart } } },
            { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: TIMEZONE } }, sales: { $sum: '$revenue' } } },
          ],
          categorySales: [
            { $group: { _id: '$productCategory', revenue: { $sum: '$revenue' } } },
            { $sort: { revenue: -1 } },
          ],
          fastMovingItems: [
            { $group: { _id: '$product', name: { $last: '$productName' }, quantitySold: { $sum: '$quantity' }, revenue: { $sum: '$revenue' }, stock: { $last: '$productStock' } } },
            { $sort: { quantitySold: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]);

    const totals = Object.fromEntries((result?.periodTotals || []).map((item) => [item._id, item.revenue]));
    const currentRevenue = totals.current || 0;
    const previousRevenue = totals.previous || 0;
    const changePercentage = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : currentRevenue > 0 ? 100 : 0;
    const salesByDate = new Map((result?.dailySales || []).map((item) => [item._id, item.sales]));
    const dailySales = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(startOfToday);
      date.setDate(date.getDate() - offset);
      const parts = toDateKey(date);
      const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
      dailySales.push({
        day: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short' }).format(date),
        sales: salesByDate.get(dateKey) || 0,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        weeklySales: { totalRevenue: currentRevenue, changePercentage },
        dailySales,
        categorySales: (result?.categorySales || []).map((item) => ({ category: item._id, revenue: item.revenue })),
        fastMovingItems: (result?.fastMovingItems || []).map(({ _id, ...item }) => item),
      },
    });
  } catch (error) {
    return next(error);
  }
};
