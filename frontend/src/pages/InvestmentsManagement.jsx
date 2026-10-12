import React, { useState, useEffect } from "react";
import API from "../api.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "./InvestmentsManagement.css";

const InvestmentsManagement = () => {
  const [investments, setInvestments] = useState([]);
  const [form, setForm] = useState({ symbol: "", quantity: "", buyPrice: "" });
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalInvested: 0, totalValue: 0, totalProfit: 0 });
  const [profitHistory, setProfitHistory] = useState([]);
  const [stockHistory, setStockHistory] = useState({});
  const [showIndividual, setShowIndividual] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  // --------------------
  // Fetch investments with loading per stock
  const fetchInvestments = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const res = await API.get(`/investments/${userId}`);
      const data = res.data;

      // Preserve previous investments to avoid flashing charts
      setInvestments((prev) => {
        const updated = data.map((i) => {
          const old = prev.find((p) => p._id === i._id);
          return old ? { ...old, ...i } : i;
        });
        return updated;
      });

      // Summary
      const totalInvested = data.reduce((sum, i) => sum + i.buyPrice * i.quantity, 0);
      const totalValue = data.reduce((sum, i) => sum + i.currentValue, 0);
      const totalProfit = totalValue - totalInvested;
      setSummary({ totalInvested, totalValue, totalProfit });

      // Portfolio profit history (keep last 10)
      setProfitHistory((prev) => [
        ...prev.slice(-9),
        { name: new Date().toLocaleTimeString(), profit: totalProfit },
      ]);

      // Individual stock profit history
      setStockHistory((prev) => {
        const newHistory = { ...prev };
        data.forEach((inv) => {
          if (!newHistory[inv.symbol]) newHistory[inv.symbol] = [];
          newHistory[inv.symbol] = [
            ...newHistory[inv.symbol].slice(-9),
            { name: new Date().toLocaleTimeString(), profit: inv.profit },
          ];
        });
        return newHistory;
      });

    } catch (err) {
      console.error("Error fetching investments", err);
    } finally {
      setLoading(false);
    }
  };

  // --------------------
  // Add investment
  const handleAddInvestment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        symbol: form.symbol.trim(),
        quantity: Number(form.quantity),
        buyPrice: Number(form.buyPrice),
      };
      await API.post(`/investments/${userId}`, payload);
      setForm({ symbol: "", quantity: "", buyPrice: "" });
      fetchInvestments();
    } catch (err) {
      console.error("Error adding investment", err);
    }
  };

  // --------------------
  // Auto refresh every 60s
  useEffect(() => {
    fetchInvestments();
    const interval = setInterval(fetchInvestments, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!userId) return (
    <div className="dashboard-page">
      <main className="dashboard">
        <section className="card">
          <h2>💹 Investments Management</h2>
          <p>Please log in to view your investments.</p>
        </section>
      </main>
    </div>
  );

  return (
    <div className="dashboard-page">
      <main className="dashboard">
        <section className="card investment-dashboard">
          <h2>💹 Investments Management</h2>
          <p>Track your portfolio, profit/loss, and diversification below.</p>

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card">
              <h3>Total Invested</h3>
              <p>${summary.totalInvested.toFixed(2)}</p>
            </div>
            <div className="summary-card">
              <h3>Current Value</h3>
              <p>${summary.totalValue.toFixed(2)}</p>
            </div>
            <div className="summary-card" style={{ color: summary.totalProfit >= 0 ? "green" : "red" }}>
              <h3>Total Profit</h3>
              <p>${summary.totalProfit.toFixed(2)}</p>
            </div>
          </div>


          <div className="card">
            <h3>Portfolio Summary & Suggestions</h3>
            <p>Total Stocks: {investments.length}</p>
            <p>Top Performing: {investments
                .sort((a, b) => (b.profit || 0) - (a.profit || 0))
                .slice(0, 3)
                .map((i) => i.symbol)
                .join(", ") || "N/A"}</p>
  
          <div className="suggestions-box">
              <h4>Suggestions:</h4>
              <ul>
                {investments.some(i => (i.profit || 0) < 0) && <li>Consider reviewing loss-making stocks.</li>}
                {investments.length > 5 && <li>Consider diversifying your portfolio.</li>}
                {investments.some(i => (i.profit || 0) > 0) && <li>Hold high-performing stocks for potential growth.</li>}
              </ul>
            </div>
          </div>

          
        
          

          {/* Buttons */}
          <div style={{ marginBottom: "10px" }}>
            <button onClick={fetchInvestments} style={{ marginRight: "10px", padding: "8px 16px", borderRadius: "5px", cursor: "pointer" }}>
              🔄 Refresh Portfolio
            </button>
            <button onClick={() => setShowIndividual(!showIndividual)} style={{ padding: "8px 16px", borderRadius: "5px", cursor: "pointer" }}>
              {showIndividual ? "Show Total Portfolio" : "Show Individual Stocks"}
            </button>
          </div>

          {/* Charts */}
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ flex: 8 }}>
              {!showIndividual && profitHistory.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={profitHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="profit" stroke={summary.totalProfit >= 0 ? "#00C49F" : "#FF4C4C"} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {showIndividual && Object.keys(stockHistory).length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {Object.keys(stockHistory).map((symbol, idx) => (
                      <Line
                        key={symbol}
                        data={stockHistory[symbol]}
                        dataKey="profit"
                        name={symbol}
                        stroke={`hsl(${(idx * 60) % 360}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Donut Chart */}
            {investments.length > 0 && (
              <div style={{ flex: 2 }}>
                <h4>Portfolio Allocation</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={investments.map((i) => ({ name: i.symbol, value: i.currentValue, profit: i.profit }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      label
                    >
                      {investments.map((i, idx) => (
                        <Cell key={idx} fill={i.profit >= 0 ? "#00C49F" : "#FF4C4C"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          {investments.length > 0 && (
            <div className="chart-container">
              <h3>Invested vs Current Value</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={investments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="buyPrice" name="Invested" fill="#8884d8" />
                  <Bar dataKey="currentValue" name="Current Value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Add Investment Form */}
          <form onSubmit={handleAddInvestment} className="investment-form">
            <input type="text" placeholder="Symbol (e.g. AAPL, BTC)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required />
            <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <input type="number" placeholder="Buy Price" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} required />
            <button type="submit">Add Investment</button>
          </form>

          {/* Investments Table */}
          {loading ? <p>Loading investments...</p> :
            investments.length === 0 ? <p>No investments yet. Add one above.</p> :
              <table className="investments-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Buy Price</th>
                    <th>Live Price</th>
                    <th>Value</th>
                    <th>Profit</th>
                    <th>% Change</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv) => (
                    <tr key={inv._id}>
                      <td>{inv.symbol}</td>
                      <td>{inv.quantity}</td>
                      <td>${inv.buyPrice}</td>
                      <td>${inv.livePrice?.toFixed(2)}</td>
                      <td>${inv.currentValue?.toFixed(2)}</td>
                      <td style={{ color: inv.profit >= 0 ? "green" : "red" }}>${inv.profit?.toFixed(2)}</td>
                      <td style={{ color: inv.changePercent >= 0 ? "green" : "red" }}>{inv.changePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>}
        </section>
      </main>
    </div>
  );
};

export default InvestmentsManagement;
