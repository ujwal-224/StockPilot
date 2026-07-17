import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';

// ─── Create Product ───────────────────────────────────────────────────────────
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, shop: req.auth.shopId });
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
    const products = await Product.find({ shop: req.auth.shopId }).sort({ createdAt: -1 });

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
    const product = before && await Product.findOneAndUpdate(
      { _id: req.params.id, shop: req.auth.shopId },
      { ...req.body, shop: req.auth.shopId },
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
