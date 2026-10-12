import React, { useEffect, useState, useMemo } from "react";
import API from "../api.js";
import { useTransactions } from "../context/TransactionsContext.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Wallet } from "lucide-react";
import NetWorthChart from "./NetWorthChart.jsx"; // Net Worth Chart
import "./Dashboard.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";


const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#FF5C8D", "#A3A1FB"];
const GOAL_COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];
const GOAL_CATEGORIES = ["Emergency Fund", "Vacation", "Education", "Investment", "Other"];

const Dashboard = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [user] = useState(storedUser || {});
  const { transactions } = useTransactions();

  const [budgets, setBudgets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [goals, setGoals] = useState([]);

  const userId = user?._id;

  const exportSummary = async () => {
  const doc = new jsPDF("p", "mm", "a4");
  doc.setFontSize(18);
  doc.text("MoneyMinder Dashboard Summary", 105, 15, { align: "center" });
  
  let y = 25;
  doc.setFontSize(12);

  // ------------------ Personal Info ------------------
  doc.text(`User: ${user.fullName}`, 10, y); y += 8;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, y); y += 12;

  // ------------------ Income, Expense, Balance ------------------
  doc.setFontSize(14);
  doc.text("Financial Summary", 10, y); y += 8;
  doc.setFontSize(12);
  doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 10, y); y += 8;
  doc.text(`Total Expense: ₹${totalExpense.toFixed(2)}`, 10, y); y += 8;
  doc.text(`Balance: ₹${totalBalance.toFixed(2)}`, 10, y); y += 12;

  // ------------------ Budget Summary ------------------
  doc.setFontSize(14);
  doc.text("Budget Overview", 10, y); y += 8;
  doc.setFontSize(12);
  doc.text(`Total Budget: ₹${totalBudget}`, 10, y); y += 8;
  doc.text(`Total Spent: ₹${totalSpent}`, 10, y); y += 8;
  doc.text(`Remaining Budget: ₹${remainingBudget >= 0 ? remainingBudget : 0}`, 10, y); y += 12;

  // ------------------ Investments ------------------
  if (investments.length > 0) {
    const totalInvested = investments.reduce((sum,i)=> sum+i.buyPrice*i.quantity,0);
    const totalCurrentValue = investments.reduce((sum,i)=> sum+i.currentValue,0);
    const totalProfit = totalCurrentValue - totalInvested;

    doc.setFontSize(14);
    doc.text("Investments Overview", 10, y); y += 8;
    doc.setFontSize(12);
    doc.text(`Total Invested: $${totalInvested}`, 10, y); y += 8;
    doc.text(`Current Value: $${totalCurrentValue}`, 10, y); y += 8;
    doc.text(`Total Profit: $${totalProfit.toFixed(2)}`, 10, y); y += 12;
  }

  // ------------------ Goals ------------------
  if (computedGoals.length > 0) {
    doc.setFontSize(14);
    doc.text("Goals Progress", 10, y); y += 8;
    doc.setFontSize(12);

    computedGoals.forEach((goal) => {
      const percent = ((goal.progress / goal.amount) * 100).toFixed(1);
      doc.text(`${goal.title} (${goal.category})`, 10, y); y += 6;
      doc.text(`Target: ₹${goal.amount} | Saved: ₹${goal.progress} (${percent}%)`, 12, y); y += 6;
      doc.text(`Status: ${goal.achieved ? "Achieved" : goal.progress > 0 ? "In Progress" : "Pending"}`, 12, y); y += 6;
      doc.text(`Suggestion: ${goal.suggestion}`, 12, y); y += 8;
    });

    const totalGoalSaved = computedGoals.reduce((acc, g) => acc + g.progress, 0);
    const totalGoalTarget = computedGoals.reduce((acc, g) => acc + g.amount, 0);
    const overallGoalPercent = totalGoalTarget > 0 ? ((totalGoalSaved / totalGoalTarget) * 100).toFixed(1) : 0;

    doc.text(`Overall Goal Completion: ${overallGoalPercent}%`, 10, y); y += 10;
  }

  // ------------------ Financial Stage ------------------
  let stageMessage = "";
  if (totalBalance < 0) stageMessage = "You are overspending. Consider reducing expenses and reviewing your budgets.";
  else if (overallGoalPercent < 30) stageMessage = "Early stage: Work on saving consistently to reach your goals.";
  else if (overallGoalPercent < 70) stageMessage = "Intermediate stage: You are making progress, keep it up!";
  else stageMessage = "Advanced stage: Excellent! You are close to achieving your financial goals.";

  doc.setFontSize(14);
  doc.text("Financial Stage & Advice", 10, y); y += 8;
  doc.setFontSize(12);
  const lines = doc.splitTextToSize(stageMessage, 180);
  doc.text(lines, 10, y); y += lines.length * 6;

  doc.save("Dashboard_Summary.pdf");
};


  // ------------------ Fetch Data ------------------
  const fetchBudgets = async () => {
    if (!userId) return;
    try {
      const res = await API.get(`/budgets/${userId}`);
      setBudgets(res.data || []);
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
    }
  };

  const fetchInvestments = async () => {
    if (!userId) return;
    try {
      const res = await API.get(`/investments/${userId}`);
      setInvestments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch investments:", err);
    }
  };

  const fetchGoals = async () => {
    if (!userId) return;
    try {
      const res = await API.get(`/goals/${userId}`);
      setGoals(res.data || []);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchInvestments();
    fetchGoals();
    document.title = "Dashboard";

    const interval = setInterval(() => {
      fetchInvestments();
      fetchGoals();
    }, 60000);

    return () => clearInterval(interval);
  }, [userId]);

  if (!user || !user._id) return <p>Please log in first.</p>;

  // ------------------ Income, Expense, Balance ------------------
  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalBalance = totalIncome - totalExpense;

  // ------------------ Budget Calculations ------------------
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = transactions
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const remainingBudget = totalBudget - totalSpent;

  const calculateSpent = (budget) => {
    const start = budget.startDate ? new Date(budget.startDate) : new Date("1970-01-01");
    const end = budget.endDate ? new Date(budget.endDate) : new Date("2100-01-01");
    return transactions
      .filter(
        (e) =>
          e.category?.toLowerCase() === budget.category.toLowerCase() &&
          e.type === "Expense" &&
          new Date(e.date) >= start &&
          new Date(e.date) <= end
      )
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  // ------------------ Chart Data ------------------
  const pieData = useMemo(
    () =>
      budgets.map((b) => ({
        name: b.category,
        value: calculateSpent(b),
      })),
    [budgets, transactions]
  );

  const budgetBarData = useMemo(
    () =>
      budgets.map((b) => ({
        category: b.category,
        Spent: calculateSpent(b),
        Budget: Number(b.amount),
      })),
    [budgets, transactions]
  );

  // ------------------ Compute Goals ------------------
  const computedGoals = goals.map(goal => {
    const goalAmount = Number(goal.amount || 0);
    const totalProgress = transactions
      .filter(t => t.type === "Income" && t.category === goal.category)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const today = new Date();
    const due = new Date(goal.targetDate);
    const monthsLeft = Math.max(
      1,
      (due.getFullYear() - today.getFullYear()) * 12 + (due.getMonth() - today.getMonth())
    );
    const remaining = Math.max(0, goalAmount - totalProgress);

    return {
      ...goal,
      progress: Math.min(totalProgress, goalAmount),
      achieved: totalProgress >= goalAmount,
      suggestion: `Save approx ₹${(remaining / monthsLeft).toFixed(2)} per month`,
    };
  });

  const totalGoalSaved = computedGoals.reduce((acc, g) => acc + g.progress, 0);
  const totalGoalTarget = computedGoals.reduce((acc, g) => acc + g.amount, 0);
  const overallGoalPercent = totalGoalTarget > 0 ? ((totalGoalSaved / totalGoalTarget) * 100).toFixed(1) : 0;

  // ------------------ Goal Status ------------------
  const getGoalStatus = (goal) => {
    if (goal.achieved) return { text: "Achieved", color: "#10B981" };
    if (goal.progress > 0) return { text: "In Progress", color: "#F59E0B" };
    return { text: "Pending", color: "#3B82F6" };
  };

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user.fullName}</h1>

      {/* ---------------- Net Worth Chart ---------------- */}
      <NetWorthChart />

      {/* ---------------- Stats Cards ---------------- */}
      <div className="stats-cards">
        <div className="card income-card">
          <h3>Total Income</h3>
          <p>₹{totalIncome.toFixed(2)}</p>
        </div>
        <div className="card expense-card">
          <h3>Total Expense</h3>
          <p>₹{totalExpense.toFixed(2)}</p>
        </div>
        <div className="card balance-card">
          <h3>Balance</h3>
          <p>₹{totalBalance.toFixed(2)}</p>
        </div>
      </div>

      {/* ---------------- Recent Transactions ---------------- */}
      <div style={{ flex: 2 }}>
        <h4>Recent Transactions</h4>
        <table className="recent-transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .slice(-5)
              .reverse()
              .map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.type}</td>
                  <td>{t.category}</td>
                  <td>₹{Number(t.amount).toFixed(2)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- Goals Section ---------------- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <h4>Goals</h4>
        {computedGoals.length === 0 && <p>No goals yet.</p>}
        {computedGoals.map((goal, idx) => {
          const percent = ((goal.progress / goal.amount) * 100).toFixed(1);
          const status = getGoalStatus(goal);
          return (
            <div key={goal._id} className="goal-card">
              <p>
                {goal.title} ({goal.category}): ₹{goal.progress} / ₹{goal.amount} ({percent}%)
              </p>
              <p style={{ color: status.color, fontSize: "0.9rem" }}>{status.text}</p>
              <p style={{ color: "#F59E0B", fontSize: "0.8rem" }}>{goal.suggestion}</p>
            </div>
          );
        })}
      </div>

      {/* ---------------- Pie Chart: Spending by Category ---------------- */}
      <div className="chart-section">
        <h3>Spending by Category</h3>
        {pieData.length === 0 ? (
          <p>No category-wise data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ---------------- Budget vs Spent ---------------- */}
      <div className="budget-summary-section">
        <h3 className="flex items-center gap-2">
          <Wallet /> Budget Management Overview
        </h3>
        <div className="summary-grid">
          <div className="summary-item">
            <h4>Total Budget</h4>
            <p>₹{totalBudget}</p>
          </div>
          <div className="summary-item">
            <h4>Total Spent</h4>
            <p>₹{totalSpent}</p>
          </div>
          <div className="summary-item">
            <h4>Remaining</h4>
            <p>₹{remainingBudget >= 0 ? remainingBudget : 0}</p>
          </div>
        </div>

        {budgetBarData.length > 0 && (
          <div className="chart-section">
            <h3>Budget vs Spent (by Category)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Budget" fill="#8884d8" />
                <Bar dataKey="Spent" fill="#FF5C8D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ---------------- Investments Charts ---------------- */}
      {investments.length > 0 && (
        <div className="budget-summary-section">
          <h3 className="flex items-center gap-2"><Wallet /> Investments Overview</h3>

          <div className="summary-grid">
            <div className="summary-item">
              <h4>Total Invested</h4>
              <p>${investments.reduce((sum,i)=> sum+i.buyPrice*i.quantity,0)}</p>
            </div>
            <div className="summary-item">
              <h4>Current Value</h4>
              <p>${investments.reduce((sum,i)=> sum+i.currentValue,0)}</p>
            </div>
            <div className="summary-item" style={{ color: investments.reduce((sum,i)=> sum+i.currentValue,0) - investments.reduce((sum,i)=> sum+i.buyPrice*i.quantity,0) >=0 ? "green":"red"}}>
              <h4>Total Profit</h4>
              <p>${(investments.reduce((sum,i)=> sum+i.currentValue,0)-investments.reduce((sum,i)=> sum+i.buyPrice*i.quantity,0)).toFixed(2)}</p>
            </div>
          </div>

          <div className="chart-section">
            <h3>Invested vs Current Value</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={investments}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="symbol"/>
                <YAxis/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="buyPrice" name="Invested" fill="#8884d8"/>
                <Bar dataKey="currentValue" name="Current Value" fill="#82ca9d"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ---------------- Overall Summary ---------------- */}
      <div className="dashboard-summary-section">
        <h3>Overall Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <h4>Total Income</h4>
            <p>₹{totalIncome.toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h4>Total Expense</h4>
            <p>₹{totalExpense.toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h4>Balance</h4>
            <p>₹{totalBalance.toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h4>Total Budget</h4>
            <p>₹{totalBudget}</p>
          </div>
          <div className="summary-item">
            <h4>Total Spent</h4>
            <p>₹{totalSpent}</p>
          </div>
          <div className="summary-item">
            <h4>Remaining Budget</h4>
            <p>₹{remainingBudget >= 0 ? remainingBudget : 0}</p>
          </div>
          {investments.length > 0 && (
            <>
              <div className="summary-item">
                <h4>Total Invested</h4>
                <p>${investments.reduce((sum,i)=> sum+i.buyPrice*i.quantity,0)}</p>
              </div>
              <div className="summary-item">
                <h4>Current Value</h4>
                <p>${investments.reduce((sum,i)=> sum+i.currentValue,0)}</p>
              </div>
              <div className="summary-item">
                <h4>Total Profit</h4>
                <p style={{ color: investments.reduce((sum,i)=> sum+i.currentValue,0) - investments.reduce((sum,i)=> sum+i.buyPrice*i.quantity,0) >=0 ? "green":"red"}}>
                  ${(investments.reduce((sum,i)=> sum+i.currentValue,0)-investments.reduce((sum,i)=> sum+i.buyPrice*i.quantity,0)).toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
        <button className="export-btn" onClick={() => exportSummary()}>
          Download Summary PDF
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
