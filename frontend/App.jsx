import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./src/components/Navbar";
import Dashboard from "./src/components/Dashboard";
import GoalsManagement from "./src/components/GoalsManagement";
import BudgetManagement from "./src/components/BudgetManagement";
import InvestmentsManagement from "./src/components/InvestmentsManagement";
import Login from "./src/components/Login";
import Signup from "./src/components/Signup";
import "./index.css";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/goals" element={<GoalsManagement />} />
        <Route path="/budget" element={<BudgetManagement />} />
        <Route path="/investments" element={<InvestmentsManagement />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
