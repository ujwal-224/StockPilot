import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'litre', 'packet', 'piece', 'bottle', 'box'],
    },
    threshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ shop: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
