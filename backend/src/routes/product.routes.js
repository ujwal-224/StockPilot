import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getLowStockProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { authenticate, allowRoles } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// POST /api/products        → Create a new product
router.post('/', allowRoles('OWNER', 'MANAGER'), createProduct);

// GET  /api/products        → Get all products
router.get('/', getAllProducts);

// GET  /api/products/low-stock  → Get low stock products (MUST be before /:id)
router.get('/low-stock', getLowStockProducts);

// GET  /api/products/:id    → Get product by ID
router.get('/:id', getProductById);

// PUT  /api/products/:id    → Update product
router.put('/:id', allowRoles('OWNER', 'MANAGER'), updateProduct);

// DELETE /api/products/:id  → Delete product
router.delete('/:id', allowRoles('OWNER'), deleteProduct);

export default router;
