import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: String,
  category: String,
  date: Date,
  type: { type: String, enum: ["Income", "Expense"] },
  amount: Number,
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
