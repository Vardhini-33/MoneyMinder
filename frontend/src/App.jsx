import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyOTP from "./pages/VerifyOTP.jsx";
import GoalsManagement from "./pages/GoalsManagement.jsx";
import BudgetManagement from "./pages/BudgetManagement.jsx";
import InvestmentsManagement from "./pages/InvestmentsManagement.jsx";
import Transactions from "./pages/Transactions.jsx";
import Profile from "./pages/Profile.jsx";
import Navbar from "./pages/Navbar.jsx";

// Layout wrapper for pages that need Navbar
const WithNavbar = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Home page without Navbar */}
        <Route path="/" element={<Home />} />

        {/* Pages with Navbar */}
        <Route path="/login" element={<WithNavbar><Login /></WithNavbar>} />
        <Route path="/signup" element={<WithNavbar><Signup /></WithNavbar>} />
        <Route path="/verify-otp" element={<WithNavbar><VerifyOTP /></WithNavbar>} />
        <Route path="/dashboard" element={<WithNavbar><Dashboard /></WithNavbar>} />
        <Route path="/profile" element={<WithNavbar><Profile /></WithNavbar>} />
        <Route path="/goals" element={<WithNavbar><GoalsManagement /></WithNavbar>} />
        <Route path="/budget" element={<WithNavbar><BudgetManagement /></WithNavbar>} />
        <Route path="/investments" element={<WithNavbar><InvestmentsManagement /></WithNavbar>} />
        <Route path="/transactions" element={<WithNavbar><Transactions /></WithNavbar>} />
      </Routes>
    </Router>
  );
}

export default App;
