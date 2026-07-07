const axios = require('axios');

// Simple in-memory cache (lives for the duration of the serverless function instance)
let ratesCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function getRates() {
  const now = Date.now();
  if (ratesCache && (now - lastFetchTime < CACHE_DURATION)) {
    return ratesCache;
  }

  const response = await axios.get('https://open.er-api.com/v6/latest/USD');
  if (response.data && response.data.result === 'success') {
    ratesCache = {
      rates: {
        USD: response.data.rates.USD,
        RUB: response.data.rates.RUB,
        AMD: response.data.rates.AMD,
      },
      time_last_update_utc: response.data.time_last_update_utc,
    };
    lastFetchTime = now;
    return ratesCache;
  }
  throw new Error('Failed to fetch rates');
}

module.exports = async (req, res) => {
  // CORS headers for Telegram Mini App
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const data = await getRates();
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching rates:', error.message);
    res.status(500).json({ success: false, error: 'Could not fetch rates' });
  }
};
