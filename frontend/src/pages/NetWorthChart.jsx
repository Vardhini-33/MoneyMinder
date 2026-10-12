// NetWorthChart.jsx
import React, { useEffect, useState } from "react";
import API from "../api.js";
import { useTransactions } from "../context/TransactionsContext.jsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const NetWorthChart = () => {
  const { transactions } = useTransactions();
  const [investments, setInvestments] = useState([]);
  const [netWorthHistory, setNetWorthHistory] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  const fetchInvestments = async () => {
    if (!userId) return;
    try {
      const res = await API.get(`/investments/${userId}`);
      setInvestments(res.data);
    } catch (err) {
      console.error("Error fetching investments", err);
    }
  };

  useEffect(() => {
    fetchInvestments();
    const interval = setInterval(fetchInvestments, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    // Calculate total income, expense, balance
    const totalIncome = transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = transactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const balance = totalIncome - totalExpense;

    const totalInvestedValue = investments.reduce((sum, i) => sum + (i.currentValue || 0), 0);

    // Net worth = balance + total investment value
    const netWorth = balance + totalInvestedValue;

    // Push to history
    setNetWorthHistory((prev) => [
      ...prev.slice(-9),
      {
        name: new Date().toLocaleTimeString(),
        Balance: balance,
        Investments: totalInvestedValue,
        NetWorth: netWorth,
      },
    ]);
  }, [transactions, investments]);

  return (
    <div className="chart-section">
      <h3>📈 Net Worth Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={netWorthHistory}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Balance" stroke="#007bff" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Investments" stroke="#00C49F" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="NetWorth" stroke="#FF5C8D" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetWorthChart;


/*import React, { useEffect, useState } from "react";
import API from "../api.js";
import { useTransactions } from "../context/TransactionsContext.jsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const NetWorthChart = () => {
  const { transactions } = useTransactions();
  const [investments, setInvestments] = useState([]);
  const [netWorthHistory, setNetWorthHistory] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  // Fetch Investments
  const fetchInvestments = async () => {
    if (!userId) return;
    try {
      const res = await API.get(`/investments/${userId}`);
      setInvestments(res.data || []);
    } catch (err) {
      console.error("Error fetching investments", err);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [userId]);

  // Calculate daily net worth
  useEffect(() => {
    if (!transactions.length && !investments.length) return;

    // Create a map of dates
    const dateMap = {};

    transactions.forEach((t) => {
      const date = new Date(t.date).toISOString().split("T")[0];
      if (!dateMap[date]) dateMap[date] = { Income: 0, Expense: 0 };
      dateMap[date][t.type] += Number(t.amount || 0);
    });

    // Sort dates
    const dates = Object.keys(dateMap).sort();

    const history = [];
    let cumulativeBalance = 0;

    dates.forEach((date) => {
      cumulativeBalance += dateMap[date].Income - dateMap[date].Expense;
      const totalInvestments = investments.reduce((sum, i) => sum + (i.currentValue || 0), 0);
      history.push({
        date,
        Balance: cumulativeBalance,
        Investments: totalInvestments,
        NetWorth: cumulativeBalance + totalInvestments,
      });
    });

    setNetWorthHistory(history);
  }, [transactions, investments]);

  return (
    <div className="chart-section">
      <h3>📈 Net Worth Overview (Daily)</h3>
      {netWorthHistory.length === 0 ? (
        <p>No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={netWorthHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Balance" stroke="#007bff" strokeWidth={2} />
            <Line type="monotone" dataKey="Investments" stroke="#00C49F" strokeWidth={2} />
            <Line type="monotone" dataKey="NetWorth" stroke="#FF5C8D" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default NetWorthChart;
*/