import { fetchLivePrice } from "./server.js";

(async () => {
  console.log("AAPL:", await fetchLivePrice("AAPL"));
  console.log("BTC:", await fetchLivePrice("BTC"));
})();
