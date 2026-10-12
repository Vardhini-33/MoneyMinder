import express from "express";
import Goal from "../models/Goal.js";
import { verifyToken, verifyUserParam } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);

// Add goal
router.post("/:userId", verifyUserParam, async (req, res) => {
  try {
    const { title, amount, category, targetDate } = req.body;
    const goal = await Goal.create({
      userId: req.userId,
      title,
      amount,
      category,
      targetDate: targetDate || new Date(),
    });
    res.json({ message: "Goal added", goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding goal" });
  }
});

// Get goals
router.get("/:userId", verifyUserParam, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ targetDate: 1 });
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching goals" });
  }
});

// Update only the authenticated user's goal.
router.put("/:goalId", async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.goalId, userId: req.userId });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const allowed = ["title", "amount", "category", "targetDate", "progress", "achieved"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) goal[key] = req.body[key];
    });

    await goal.save();
    res.json({ message: "Goal updated", goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating goal" });
  }
});

// Delete only the authenticated user's goal.
router.delete("/:goalId", async (req, res) => {
  try {
    const deleted = await Goal.findOneAndDelete({
      _id: req.params.goalId,
      userId: req.userId,
    });
    if (!deleted) return res.status(404).json({ message: "Goal not found" });
    res.json({ message: "Goal deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting goal" });
  }
});

export default router;
