import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    income: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },

    // Email verification state used by the OTP flow.
    isVerified: { type: Boolean, default: true },
    otpHash: { type: String },
    otpExpiresAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
