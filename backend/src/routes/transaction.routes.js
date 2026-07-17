import { Router } from 'express';
import {
  createTransaction,
  getAllTransactions,
} from '../controllers/transaction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// POST /api/transactions  → Record a new transaction
router.post('/', createTransaction);

// GET  /api/transactions  → Get all transactions (newest first)
router.get('/', getAllTransactions);

export default router;
