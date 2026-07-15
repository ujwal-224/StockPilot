import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getLowStockProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';

const router = Router();

// POST /api/products        → Create a new product
router.post('/', createProduct);

// GET  /api/products        → Get all products
router.get('/', getAllProducts);

// GET  /api/products/low-stock  → Get low stock products (MUST be before /:id)
router.get('/low-stock', getLowStockProducts);

// GET  /api/products/:id    → Get product by ID
router.get('/:id', getProductById);

// PUT  /api/products/:id    → Update product
router.put('/:id', updateProduct);

// DELETE /api/products/:id  → Delete product
router.delete('/:id', deleteProduct);

export default router;
