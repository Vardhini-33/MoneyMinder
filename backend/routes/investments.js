import express from "express";
import Investment from "../models/Investment.js";
import axios from "axios";
import { verifyToken, verifyUserParam } from "../middleware/auth.js";

const router = express.Router();

const fetchLivePrice = async (symbol) => {
  const finnhubKey = process.env.FINNHUB_API_KEY;
  const mockPrices = { AAPL: 171.18, TSLA: 285.5, MSFT: 330.2, BTC: 35000, ETH: 2200, BNB: 310, DOGE: 0.075 };

  if (!finnhubKey || !symbol) return mockPrices[symbol?.toUpperCase()] || 100;

  try {
    const upperSymbol = symbol.toUpperCase();
    const cryptoSymbols = ["BTC", "ETH", "BNB", "DOGE"];
    const url = cryptoSymbols.includes(upperSymbol)
      ? `https://finnhub.io/api/v1/quote?symbol=BINANCE:${upperSymbol}USDT&token=${finnhubKey}`
      : `https://finnhub.io/api/v1/quote?symbol=NASDAQ:${upperSymbol}&token=${finnhubKey}`;

    const { data } = await axios.get(url);
    return parseFloat(data.c || mockPrices[upperSymbol] || 100);
  } catch (err) {
    console.error(`Finnhub fetch error for ${symbol}:`, err.message || err);
    return mockPrices[symbol.toUpperCase()] || 100;
  }
};

router.use(verifyToken);

// Add investment
router.post("/:userId", verifyUserParam, async (req, res) => {
  try {
    const { symbol, quantity, buyPrice } = req.body;
    if (!symbol || quantity <= 0 || buyPrice < 0) {
      return res.status(400).json({ message: "Invalid investment details" });
    }

    const investment = await Investment.create({
      userId: req.userId,
      symbol: symbol.toUpperCase(),
      quantity,
      buyPrice,
    });

    res.json({ message: "Investment added", investment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving investment" });
  }
});

// Get investments and calculate current value/profit from Finnhub prices.
router.get("/:userId", verifyUserParam, async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.userId });
    const updatedInvestments = [];

    for (const inv of investments) {
      const livePrice = await fetchLivePrice(inv.symbol);
      const currentValue = inv.quantity * livePrice;
      const investedValue = inv.quantity * inv.buyPrice;
      const profit = currentValue - investedValue;
      const changePercent = investedValue ? ((profit / investedValue) * 100).toFixed(2) : "0.00";

      updatedInvestments.push({
        ...inv._doc,
        livePrice,
        currentValue,
        profit,
        changePercent,
      });
    }

    res.json(updatedInvestments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching investments" });
  }
});

export default router;
