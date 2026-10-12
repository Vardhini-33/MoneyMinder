import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";

const router = express.Router();

const OTP_EXPIRY_MS = 10 * 60 * 1000;

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const sendOtpEmail = async (email, otp) => {
  // Resend is used through its REST API, so no additional mail dependency is required.
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP] ${email}: ${otp}`);
      return;
    }
    throw new Error("Email service is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "MoneyMinder verification code",
      html: `<p>Your MoneyMinder verification code is <strong>${otp}</strong>.</p>
             <p>This code expires in 10 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OTP email failed: ${errorText}`);
  }
};

const issueOtp = async (user) => {
  const otp = generateOtp();
  user.otpHash = await bcrypt.hash(otp, 10);
  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await user.save();
  await sendOtpEmail(user.email, otp);
  return otp;
};

// Signup: create an unverified account and send an OTP.
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser?.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = existingUser || new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
    });

    user.fullName = fullName.trim();
    user.password = passwordHash;
    user.isVerified = false;

    await issueOtp(user);

    const response = {
      message: "OTP sent. Please verify your email.",
      email: user.email,
    };


    res.status(201).json(response);
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message || "Signup failed" });
  }
});

// Verify OTP and issue JWT only after successful verification.
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Account is already verified" });
    if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    const validOtp = await bcrypt.compare(otp.toString(), user.otpHash);
    if (!validOtp) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = generateToken(user._id.toString());
    res.json({
      message: "Email verified successfully",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

// Resend OTP for an unverified account.
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Account is already verified" });

    await issueOtp(user);
    res.json({ message: "A new OTP has been sent" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: err.message || "Failed to resend OTP" });
  }
});

// Login: verify the bcrypt hash and issue a JWT.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email with the OTP before logging in.",
      });
    }

    let validPassword = await bcrypt.compare(password, user.password);

    // Backward-compatible migration for accounts created by the older version,
    // which stored passwords directly. Successful login immediately upgrades
    // the stored password to a bcrypt hash.
    if (!validPassword && user.password === password) {
      user.password = await bcrypt.hash(password, 12);
      await user.save();
      validPassword = true;
    }

    if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id.toString());

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
