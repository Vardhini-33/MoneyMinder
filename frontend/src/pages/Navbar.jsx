import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem("user")); // check login

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo">
          <Link to={user ? "/profile" : "/"}>MoneyMinder</Link>
        </div>
      </div>

      <ul className="nav-links">
        <li>
          <Link to={user ? "/profile" : "/"}>{user ? "Profile" : "Home"}</Link>
        </li>
        {user && (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/goals">Goals</Link></li>
            <li><Link to="/budget">Budget</Link></li>
            <li><Link to="/investments">Investments</Link></li>
            <li><Link to="/transactions">Transactions</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
