// GoalsManagement.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Trophy, Trash2, Target, Clock, PlusCircle } from "lucide-react";
import API from "../api.js"; // backend API instance
import { useTransactions } from "../context/TransactionsContext.jsx";
import "./GoalsManagement.css";

const categories = ["Emergency Fund", "Vacation", "Education", "Investment", "Other"];
const COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];

const GoalsManagement = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const { transactions } = useTransactions();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "Emergency Fund",
    amount: "",
    targetDate: "",
  });

  // --------------------
  // Fetch goals from backend
  // --------------------
  const fetchGoals = async () => {
    if (!storedUser) return;
    setLoading(true); setError("");
    try {
      const res = await API.get(`/goals/${storedUser._id}`);
      setGoals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch goals. Make sure backend is running.");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals(); // initial fetch
  }, []);

  // --------------------
  // Delete goal
  // --------------------
  const deleteGoal = async (goalId) => {
    try {
      await API.delete(`/goals/${goalId}`);
      setGoals(goals.filter(g => g._id !== goalId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete goal.");
    }
  };

  // --------------------
  // Add new goal
  // --------------------
  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.amount || !newGoal.targetDate) {
      return alert("Please fill all fields.");
    }
    try {
      const payload = { ...newGoal };
      const res = await API.post(`/goals/${storedUser._id}`, payload);
      setGoals([...goals, res.data.goal || res.data]); // API may return goal in res.data.goal
      setNewGoal({ title: "", category: "Emergency Fund", amount: "", targetDate: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to add goal.");
    }
  };

  // --------------------
  // Calculate suggestion (monthly saving required)
  // --------------------
  const calculateSuggestion = (target, progress, targetDate) => {
    const today = new Date();
    const due = new Date(targetDate);
    const monthsLeft = Math.max(1, (due.getFullYear() - today.getFullYear()) * 12 + (due.getMonth() - today.getMonth()));
    const remaining = Math.max(0, target - progress);
    return `Save approx ₹${(remaining / monthsLeft).toFixed(2)} per month`;
  };

  // --------------------
  // Compute goal progress dynamically
  // --------------------
  const computedGoals = goals.map(goal => {
    const goalAmount = Number(goal.amount || 0);
    const totalProgress = transactions
      .filter(t => t.type === "Income" && t.category === goal.category)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      ...goal,
      progress: Math.min(totalProgress, goalAmount),
      achieved: totalProgress >= goalAmount,
      suggestion: calculateSuggestion(goalAmount, totalProgress, goal.targetDate),
    };
  });

  // --------------------
  // Goal status display
  // --------------------
  const getGoalStatus = (goal) => {
    if (goal.achieved) return { text: "Achieved", color: "#10B981", icon: <Trophy size={20} /> };
    if (goal.progress > 0) return { text: "In Progress", color: "#F59E0B", icon: <Clock size={20} /> };
    return { text: "Pending", color: "#3B82F6", icon: <Target size={20} /> };
  };

  // --------------------
  // Chart data
  // --------------------
  const chartData = categories.map(cat => ({
    name: cat,
    value: computedGoals.filter(g => g.category === cat).length,
  }));

  // --------------------
  // Overall stats
  // --------------------
  const totalSaved = computedGoals.reduce((acc, g) => acc + g.progress, 0);
  const totalTarget = computedGoals.reduce((acc, g) => acc + g.amount, 0);
  const overallPercent = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0;

  if (loading) return <p className="loading">Loading goals...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <motion.div className="dashboard-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
      <h1 className="dashboard-title">💎 Smart Goal Dashboard</h1>

      {/* Add Goal */}
      <section className="add-goal card">
        <h3><PlusCircle /> Add New Goal</h3>
        <div className="form-grid">
          <input type="text" placeholder="Goal Title" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} />
          <select value={newGoal.category} onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="number" placeholder="Target Amount" value={newGoal.amount} onChange={(e) => setNewGoal({ ...newGoal, amount: e.target.value })} />
          <input type="date" value={newGoal.targetDate} onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })} />
          <button onClick={handleAddGoal}>Add Goal</button>
        </div>
      </section>

      {/* Overview */}
      <div className="overview-cards">
        <div className="glass-card"><h3>Total Goals</h3><p>{computedGoals.length}</p></div>
        <div className="glass-card"><h3>Achieved</h3><p>{computedGoals.filter(g => g.achieved).length}</p></div>
        <div className="glass-card"><h3>Total Saved</h3><p>₹{totalSaved}</p></div>
        <div className="glass-card highlight">
          <h3>Overall Progress</h3>
          <div className="circle-progress">
            <div className="circle-fill" style={{ background: `conic-gradient(#06b6d4 ${overallPercent*3.6}deg, #e5e7eb 0deg)` }}></div>
            <span>{overallPercent}%</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container glass-card">
        <h3>📊 Goal Category Distribution</h3>
        <PieChart width={360} height={280}>
          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={110} label>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      {/* Goals List */}
      <div className="goals-grid">
        {computedGoals.map(goal => {
          const status = getGoalStatus(goal);
          const percent = ((goal.progress / goal.amount) * 100).toFixed(1);
          return (
            <div key={goal._id} className="goal-card glass-card">
              <div className="goal-header">
                <h3>{goal.title}</h3>
                <span>{goal.category}</span>
              </div>
              <div className="goal-status" style={{ color: status.color }}>{status.icon} {status.text}</div>
              <div className="goal-details">
                <p>Target: ₹{goal.amount}</p>
                <p>Progress: ₹{goal.progress}</p>
                <p>Due: {new Date(goal.targetDate).toLocaleDateString()}</p>
              </div>
              <p className="goal-suggestion" style={{ color: "#f59e0b", marginTop: "5px" }}>
                {goal.suggestion}
              </p>
              <div className="goal-actions">
                <button onClick={() => deleteGoal(goal._id)}><Trash2 size={18}/> Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default GoalsManagement;
