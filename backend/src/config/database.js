import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }

    await mongoose.connect(mongoUri, {
      // Force IPv4 to prevent SRV lookup failures on restricted networks (e.g. mobile hotspots)
      family: 4,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message || error);
    process.exit(1);
  }
};

export default connectDB;
