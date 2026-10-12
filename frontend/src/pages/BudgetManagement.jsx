import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Wallet, Bell, PlusCircle } from "lucide-react";
import API from "../api.js";
import "./BudgetManagement.css";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#FF5C8D", "#A3A1FB"];

const BudgetManagement = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [budgetInput, setBudgetInput] = useState({
    category: "",
    amount: "",
    startDate: "",
    endDate: "",
  });

  // --------------------
  // Fetch Budgets & Expenses
  // --------------------
  const fetchBudgets = async () => {
    if (!userId) return;
    try {
      const res = await API.get(`/budgets/${userId}`);
      setBudgets(res.data || []);
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
    }
  };

  const fetchExpenses = async () => {
    if (!userId) return;
    try {
      const res = await API.get(`/transactions/${userId}`);
      setExpenses(res.data || []);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchExpenses();
  }, [userId]);

  // --------------------
  // Calculate spent per budget (case-insensitive + date filtered)
  // --------------------
  const calculateSpent = (budget) => {
    const start = budget.startDate ? new Date(budget.startDate) : new Date("1970-01-01");
    const end = budget.endDate ? new Date(budget.endDate) : new Date("2100-01-01");
    return expenses
      .filter(
        (e) =>
          e.category?.toLowerCase() === budget.category.toLowerCase() &&
          e.type === "Expense" &&
          new Date(e.date) >= start &&
          new Date(e.date) <= end
      )
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  // --------------------
  // Add New Budget
  // --------------------
  const handleAddBudget = async () => {
    if (!budgetInput.category || !budgetInput.amount)
      return alert("Please fill all fields!");

    const newBudget = { ...budgetInput, userId, amount: Number(budgetInput.amount) };
    try {
      await API.post("/budgets", newBudget);
      setBudgetInput({ category: "", amount: "", startDate: "", endDate: "" });
      fetchBudgets();
      fetchExpenses();
    } catch (err) {
      console.error("Failed to add budget:", err);
    }
  };

  // --------------------
  // Notifications for nearing/exceeding budgets
  // --------------------
  useEffect(() => {
    const newNotifications = [];
    budgets.forEach((b) => {
      const spent = calculateSpent(b);
      const percent = (spent / b.amount) * 100;
      if (percent >= 100)
        newNotifications.push({ type: "danger", message: `⚠️ ${b.category} budget exceeded!` });
      else if (percent >= 80)
        newNotifications.push({ type: "warning", message: `⚠️ ${b.category} nearing its limit (${percent.toFixed(1)}%)!` });
    });
    setNotifications(newNotifications);
  }, [budgets, expenses]);

  // --------------------
  // Charts Data
  // --------------------
  const pieData = useMemo(
    () => budgets.map(b => ({ name: b.category, value: calculateSpent(b) })),
    [budgets, expenses]
  );

  const barData = useMemo(
    () => budgets.map(b => ({ category: b.category, Spent: calculateSpent(b), Budget: Number(b.amount) })),
    [budgets, expenses]
  );

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = expenses.filter(e => e.type === "Expense").reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = totalBudget - totalSpent;

  return (
    <div className="budget-page">
      <motion.main className="dashboard w-full max-w-7xl mx-auto p-5 space-y-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}>

        {/* Header */}
        <section className="card header text-center">
          <h2 className="flex justify-center items-center gap-3 text-3xl font-bold">
            <Wallet size={28} /> Budget Management
          </h2>
          <p className="mt-2 text-gray-500 text-lg">📊 Track your monthly budgets & expenses dynamically.</p>
        </section>

        {/* Notifications */}
        <AnimatePresence>
          {notifications.length > 0 && (
            <motion.div className="notification-panel"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}>
              {notifications.map((n, i) => (
                <div key={i} className={`notif ${n.type === "danger" ? "text-red-400" : "text-yellow-400"}`}>
                  <Bell size={18} className="inline mr-2" /> {n.message}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Budget */}
        <section className="card form-section">
          <h3 className="flex items-center gap-2 text-xl font-semibold mb-3"><PlusCircle /> Add New Budget</h3>
          <div className="form-grid">
            <input type="text" placeholder="Category" value={budgetInput.category}
              onChange={(e) => setBudgetInput({ ...budgetInput, category: e.target.value })} />
            <input type="number" placeholder="Amount" value={budgetInput.amount}
              onChange={(e) => setBudgetInput({ ...budgetInput, amount: e.target.value })} />
            <input type="date" value={budgetInput.startDate}
              onChange={(e) => setBudgetInput({ ...budgetInput, startDate: e.target.value })} />
            <input type="date" value={budgetInput.endDate}
              onChange={(e) => setBudgetInput({ ...budgetInput, endDate: e.target.value })} />
            <button onClick={handleAddBudget}>Add</button>
          </div>
        </section>

        {/* Summary */}
        <section className="summary-grid">
          <div className="summary-item"><h4>Total Budget</h4><p>₹{totalBudget}</p></div>
          <div className="summary-item"><h4>Total Spent</h4><p>₹{totalSpent}</p></div>
          <div className="summary-item"><h4>Remaining</h4><p>₹{remaining >= 0 ? remaining : 0}</p></div>
        </section>

        {/* Budget Progress */}
        <section className="card">
          <h3>Budget Progress</h3>
          {budgets.length === 0 && <p>No budgets yet.</p>}
          <div className="budget-progress-list">
            {budgets.map((b, i) => {
              const spent = calculateSpent(b);
              const percent = Math.min((spent / b.amount) * 100, 100);
              return (
                <div key={i} className="budget-progress-item">
                  <div className="flex justify-between mb-1">
                    <span>{b.category}</span>
                    <span>{percent.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percent}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">₹{spent} / ₹{b.amount}</p>
                  {percent > 80 && percent < 100 && <p className="text-yellow-500 text-sm">⚠️ Consider reducing expenses in this category</p>}
                  {percent >= 100 && <p className="text-red-500 text-sm">❌ Budget exceeded! Stop spending here</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* Charts */}
        <section className="charts-section">
          <div className="chart-card">
            <h3>Spending by Category</h3>
            {expenses.length === 0 ? <p>No transactions yet</p> :
              <PieChart width={320} height={280}>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            }
          </div>

          <div className="chart-card">
            <h3>Budget vs Spent</h3>
            {expenses.length === 0 ? <p>No transactions yet</p> :
              <BarChart width={360} height={280} data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Budget" fill="#8884d8" />
                <Bar dataKey="Spent" fill="#FF5C8D" />
              </BarChart>
            }
          </div>
        </section>
      </motion.main>
    </div>
  );
};

export default BudgetManagement;
