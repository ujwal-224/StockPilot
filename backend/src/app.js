import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware/error.middleware.js";

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
// Global Error Handler
// ===============================
app.use(errorHandler);

export default app;