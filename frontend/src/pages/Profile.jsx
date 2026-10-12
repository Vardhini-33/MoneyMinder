import React, { useEffect, useState } from "react";
import "./Profile.css";
import { useTransactions } from "../context/TransactionsContext.jsx";

const Profile = () => {
  const [user, setUser] = useState(null);
  const { transactions } = useTransactions();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  if (!user) return <p className="loading-text">Loading profile...</p>;

  // 🧮 Compute totals dynamically from transactions
  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="avatar">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <h2>{user.fullName}</h2>
          <p className="email">{user.email}</p>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="label">Income:</span>
            <span className="value">₹{totalIncome}</span>
          </div>
          <div className="detail-item">
            <span className="label">Expenses:</span>
            <span className="value">₹{totalExpenses}</span>
          </div>
          <div className="detail-item">
            <span className="label">Balance:</span>
            <span className="value">₹{balance}</span>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
