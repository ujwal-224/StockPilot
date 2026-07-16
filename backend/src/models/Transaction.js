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
      min: 1,
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

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
