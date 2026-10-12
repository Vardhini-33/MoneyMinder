import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  amount: Number,
  category: String,
  targetDate: Date,
  progress: { type: Number, default: 0 },
  achieved: { type: Boolean, default: false },
});

const Goal = mongoose.model("Goal", goalSchema);
export default Goal;
