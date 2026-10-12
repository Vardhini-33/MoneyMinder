import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  symbol: String,
  quantity: Number,
  buyPrice: Number,
  date: { type: Date, default: Date.now },
});

const Investment = mongoose.model("Investment", investmentSchema);
export default Investment;
