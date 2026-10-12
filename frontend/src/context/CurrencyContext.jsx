// src/context/CurrencyContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");
  const [rate, setRate] = useState(1);

  // Fetch exchange rate whenever currencies change
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await axios.get(
          `https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`
        );
        setRate(res.data.rates[toCurrency]);
      } catch (err) {
        console.error("Error fetching exchange rate:", err);
      }
    };
    fetchRate();
  }, [fromCurrency, toCurrency]);

  return (
    <CurrencyContext.Provider
      value={{ fromCurrency, setFromCurrency, toCurrency, setToCurrency, rate }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
