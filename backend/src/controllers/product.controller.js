import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';
import Transaction from '../models/Transaction.js';

// ─── Create Product ───────────────────────────────────────────────────────────
export const createProduct = async (req, res, next) => {
  try {
    const { name, category, price, stock, unit, threshold, image } = req.body;
    const product = await Product.create({ name, category, price, stock, unit, threshold, image, shop: req.auth.shopId });
    await AuditLog.create({
      shop: req.auth.shopId, user: req.auth.userId, action: 'PRODUCT_CREATED',
      resourceType: 'PRODUCT', resourceId: product._id, after: product.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Products ─────────────────────────────────────────────────────────
export const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ shop: req.auth.shopId }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Low Stock Products ───────────────────────────────────────────────────
export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      shop: req.auth.shopId,
      $expr: { $lte: ['$stock', '$threshold'] },
    }).sort({ stock: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Product By ID ────────────────────────────────────────────────────────
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, shop: req.auth.shopId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Product ───────────────────────────────────────────────────────────
export const updateProduct = async (req, res, next) => {
  try {
    const before = await Product.findOne({ _id: req.params.id, shop: req.auth.shopId });
    const allowed = ['name', 'category', 'price', 'stock', 'unit', 'threshold', 'image'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const product = before && await Product.findOneAndUpdate(
      { _id: req.params.id, shop: req.auth.shopId },
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await AuditLog.create({
      shop: req.auth.shopId, user: req.auth.userId, action: 'PRODUCT_UPDATED',
      resourceType: 'PRODUCT', resourceId: product._id, before: before.toObject(), after: product.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Product ───────────────────────────────────────────────────────────
export const deleteProduct = async (req, res, next) => {
  try {
    if (await Transaction.exists({ product: req.params.id, shop: req.auth.shopId })) {
      return res.status(409).json({ success: false, message: 'Products with transaction history cannot be deleted' });
    }
    const product = await Product.findOneAndDelete({ _id: req.params.id, shop: req.auth.shopId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }


    await AuditLog.create({
      shop: req.auth.shopId, user: req.auth.userId, action: 'PRODUCT_DELETED',
      resourceType: 'PRODUCT', resourceId: product._id, before: product.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
