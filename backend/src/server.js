import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import app from "./app.js";

// Read PORT from .env
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 StockPilot Backend is running on http://localhost:${PORT}`);
});