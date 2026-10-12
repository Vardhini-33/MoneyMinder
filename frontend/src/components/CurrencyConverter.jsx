// src/components/CurrencyConverter.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CurrencyConverter.css";

const CurrencyConverter = () => {
  const [currencies, setCurrencies] = useState([]);
  const [amount, setAmount] = useState(1);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("INR");
  const [result, setResult] = useState(null);

  // Fetch list of supported currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await axios.get("https://api.exchangerate.host/symbols");
        setCurrencies(Object.keys(res.data.symbols));
      } catch (err) {
        console.error("Error fetching currencies", err);
      }
    };
    fetchCurrencies();
  }, []);

  const handleConvert = async () => {
    try {
      const res = await axios.get(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`);
      setResult(res.data.result);
    } catch (err) {
      console.error("Conversion failed", err);
      setResult(null);
    }
  };

  return (
    <div className="converter-card">
      <h3>💱 Currency Converter</h3>
      <div className="converter-form">
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          {currencies.map((cur) => <option key={cur} value={cur}>{cur}</option>)}
        </select>
        <span>➡</span>
        <select value={to} onChange={(e) => setTo(e.target.value)}>
          {currencies.map((cur) => <option key={cur} value={cur}>{cur}</option>)}
        </select>
        <button onClick={handleConvert}>Convert</button>
      </div>
      {result !== null && <p className="result">{amount} {from} = {result.toFixed(2)} {to}</p>}
    </div>
  );
};

export default CurrencyConverter;
