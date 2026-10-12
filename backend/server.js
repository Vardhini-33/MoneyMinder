import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import goalsRoutes from "./routes/goals.js";
import transactionsRoutes from "./routes/transactions.js";
import budgetsRoutes from "./routes/budgets.js";
import investmentsRoutes from "./routes/investments.js";

dotenv.config();

const app = express();

// --------------------
// CORS Configuration
// --------------------
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and 127.0.0.1 on any port during development.
      const isLocalOrigin =
        origin &&
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      // Allow the configured production frontend, if provided.
      const productionOrigin = process.env.FRONTEND_URL;

      if (
        !origin ||
        isLocalOrigin ||
        (productionOrigin && origin === productionOrigin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

// --------------------
// Middleware
// --------------------
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// --------------------
// MongoDB Connection
// --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });

// --------------------
// Multer Setup (CSV Uploads)
// --------------------
export const upload = multer({ dest: "uploads/" });

// --------------------
// API Routes
// --------------------
app.use("/api", authRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/investments", investmentsRoutes);

// --------------------
// Serve React Frontend
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(buildPath));

// Handle frontend routes without intercepting API requests.
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    return next();
  }

  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      next(err);
    }
  });
});

// --------------------
// Global Error Handler
// --------------------
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.message);

  if (err.message?.startsWith("CORS blocked origin:")) {
    return res.status(403).json({
      message: "Origin not allowed by CORS",
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});