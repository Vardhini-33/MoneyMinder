import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import heroImage from '../assets/makeme.png';
import teamImage from '../assets/team.png';  

const Home = () => {
  const navigate = useNavigate();
  const aboutRef = useRef(null);

  const scrollToAbout = () => {
    if (aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="logo">MoneyMinder</div>
        <nav className="nav-links">
          <ul>
            <li><a href="/">Home</a></li>
            <li><button onClick={scrollToAbout}>About</button></li>
            <li><button onClick={() => navigate('/login')} className="nav-btn">Login</button></li>
            <li><button onClick={() => navigate('/signup')} className="nav-btn">Signup</button></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <h1>Take Control of Your Finances with <span>MoneyMinder</span></h1>
          <p>
            Track your income, expenses and savings effortlessly. Set and achieve financial goals.
            Get insights and reports to manage your finances like a pro.
          </p>
          <button className="get-started" onClick={() => navigate('/signup')}>Get Started →</button>
        </div>
        <div className="hero-right">
          <img src={heroImage} alt="Finance dashboard illustration" />
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" ref={aboutRef}>
        <div className="about-left">
          <h1>WHO WE ARE</h1>
          <p>
            MoneyMinder is your ultimate personal finance tracker, designed to help you take full control of your income,
            expenses, savings, and financial goals effortlessly.
          </p>
          <p>
            At MoneyMinder, we believe financial clarity leads to financial freedom. Our platform provides intuitive tools
            to track your spending, analyze your savings, and set achievable goals—all in one secure and user-friendly dashboard.
            Whether you’re budgeting for the future or optimizing your expenses, MoneyMinder ensures every rupee is accounted for,
            giving you peace of mind.
          </p>
        </div>
        <div className="about-right">
          <img src={teamImage} alt="Team collaboration" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Advanced Features</h2>
        <div className="features-grid">
          <FeatureCard
            title="Smart Budgeting"
            description="Automatically allocate income into categories and track spending with real-time insights."
          />
          <FeatureCard
            title="Manual Expense & Income Tracking"
            description="Easily log transactions, categorize them, and monitor cash flow."
          />
          <FeatureCard
            title="Goal-Based Savings"
            description="Set savings goals, track progress, and stay motivated to achieve financial milestones."
          />
          <FeatureCard
            title="Investment Portfolio"
            description="Monitor your investments, performance, and allocation in real-time."
          />
          <FeatureCard
            title="Comprehensive Reports"
            description="Generate detailed financial reports to analyze income, expenses, and savings trends."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ title, description }) => (
  <div className="feature-card">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default Home;