import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api.js";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return alert("Email and password are required");

    try {
      const res = await API.post("/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Welcome Back</h2>
        <p>Login to your account</p>

        <input type="email" name="email" placeholder="Email" value={form.email}
          onChange={handleChange} required />

        <input type="password" name="password" placeholder="Password" value={form.password}
          onChange={handleChange} required />

        <button type="submit" className="button-primary">Login</button>

        <div className="divider">or</div>
        <button type="button" className="google-btn" disabled>
          Google sign-in coming soon
        </button>

        <p>
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
