import { Router } from 'express';
import {
  createTransaction,
  getAllTransactions,
} from '../controllers/transaction.controller.js';

const router = Router();

// POST /api/transactions  → Record a new transaction
router.post('/', createTransaction);

// GET  /api/transactions  → Get all transactions (newest first)
router.get('/', getAllTransactions);

export default router;
