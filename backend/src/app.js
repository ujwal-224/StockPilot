import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware/error.middleware.js";
import productRoutes from "./routes/product.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import teamRoutes from "./routes/team.routes.js";
import shopRoutes from "./routes/shop.routes.js";

const app = express();
app.set("trust proxy", 1);

// ===============================
// Middleware
// ===============================
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

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
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/shop", shopRoutes);

// ===============================
// Global Error Handler
// ===============================
app.use(errorHandler);

export default app;
