import { Router } from 'express';
import { createProduct, getAllProducts } from '../controllers/product.controller.js';

const router = Router();

// POST /api/products  → Create a new product
router.post('/', createProduct);

// GET  /api/products  → Get all products
router.get('/', getAllProducts);

export default router;
