import express from "express";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import { verifyToken, verifyUserParam } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyToken);

// Get budgets
router.get("/:userId", verifyUserParam, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.json(budgets);
  } catch (err) {
    console.error("Budget fetch error:", err);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

// Add budget
router.post("/", async (req, res) => {
  try {
    const { category, amount, startDate, endDate, priority } = req.body;
    const budget = await Budget.create({
      userId: req.userId,
      category,
      amount,
      startDate,
      endDate,
      priority,
    });
    res.status(201).json({ message: "Budget added successfully", budget });
  } catch (err) {
    console.error("Add budget error:", err);
    res.status(500).json({ error: "Failed to add budget" });
  }
});

// Forecast
router.get("/forecast/:userId", verifyUserParam, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    const transactions = await Transaction.find({ userId: req.userId });
    const today = new Date();

    const forecast = budgets.map((b) => {
      const spent = transactions
        .filter((t) => t.category === b.category && t.type === "Expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const start = new Date(b.startDate || today);
      const end = new Date(b.endDate || today);
      const totalDays = (end - start) / (1000 * 60 * 60 * 24) || 1;
      const daysPassed = Math.max(1, Math.min(totalDays, (today - start) / (1000 * 60 * 60 * 24)));

      const dailySpend = spent / daysPassed;
      const projected = dailySpend * totalDays;
      const difference = b.amount - projected;

      return { category: b.category, spent, budget: b.amount, projected, difference };
    });

    res.json(forecast);
  } catch (err) {
    console.error("Forecast error:", err);
    res.status(500).json({ error: "Forecast calculation failed" });
  }
});

export default router;
