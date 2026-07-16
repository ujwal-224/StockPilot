import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware/error.middleware.js";
import productRoutes from "./routes/product.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Health Check Route
// ===============================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StockPilot Backend Running",
  });
});

// ===============================
// API Routes
// ===============================
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);

// ===============================
// Global Error Handler
// ===============================
app.use(errorHandler);

export default app;
