import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  userId: String,
  category: String,
  amount: Number,
  startDate: String,
  endDate: String,
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
});

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
