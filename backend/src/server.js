import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import app from "./app.js";
import connectDB from "./config/database.js";
import { logMem0Status } from "./services/mem0.service.js";
import { startOutboxWorker } from "./services/outbox-worker.service.js";

// Read PORT from .env
const PORT = process.env.PORT || 5000;

// Connect to database before starting server
await connectDB();
startOutboxWorker();

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 StockPilot Backend is running on http://localhost:${PORT}`);
  logMem0Status();
});
