import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api.js";
import "./Auth.css";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.password) {
      return alert("All fields are required");
    }

    try {
      const res = await API.post("/signup", form);
      alert(res.data.message);
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Get Started</h2>
        <p>Create your account</p>

        <input type="text" name="fullName" placeholder="Full Name" value={form.fullName}
          onChange={handleChange} required />

        <input type="email" name="email" placeholder="Email" value={form.email}
          onChange={handleChange} required />

        <div className="input-group">
          <input type={showPassword ? "text" : "password"} name="password"
            placeholder="Password" value={form.password} onChange={handleChange} required minLength={6} />
          <span className="toggle-icon" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button type="submit" className="button-primary">Sign Up</button>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
