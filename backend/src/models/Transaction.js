import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['SALE', 'PURCHASE', 'ADJUSTMENT'],
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: { type: Number, min: 0, default: 0 },
    productSnapshot: {
      name: { type: String, trim: true },
      category: { type: String, trim: true },
      unit: { type: String, trim: true },
    },
    previousStock: {
      type: Number,
    },
    newStock: {
      type: Number,
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ shop: 1, createdAt: -1 });
transactionSchema.index({ shop: 1, type: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
