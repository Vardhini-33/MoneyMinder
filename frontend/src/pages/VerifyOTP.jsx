import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api.js";
import "./Auth.css";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    if (!email || otp.length !== 6) return alert("Enter a valid 6-digit OTP");

    setLoading(true);
    try {
      const res = await API.post("/verify-otp", { email, otp });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Email verified successfully!");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const res = await API.post("/resend-otp", { email });
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={verify}>
        <h2>Verify Email</h2>
        <p>Enter the 6-digit OTP sent to your email.</p>

        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" required />

        <input type="text" inputMode="numeric" maxLength={6} value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="6-digit OTP" required />

        <button type="submit" className="button-primary" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button type="button" className="google-btn" onClick={resend}>
          Resend OTP
        </button>
      </form>
    </div>
  );
};

export default VerifyOTP;
