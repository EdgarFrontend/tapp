const axios = require('axios');

// Cache
let ratesCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches exchange rates from the Central Bank of Russia (ЦБ РФ) XML feed.
 * Returns rates in { USD: 1, RUB: X, AMD: Y } format (units per 1 USD).
 */
async function fetchCBRRates() {
  const response = await axios.get('https://www.cbr.ru/scripts/XML_daily.asp', {
    responseType: 'text',
    timeout: 10000,
    headers: { 'Accept-Charset': 'windows-1251' },
  });

  const xml = response.data;

  // Helper: extract Nominal and Value for a given CharCode
  function parseValute(charCode) {
    const re = new RegExp(
      `<CharCode>${charCode}<\\/CharCode>[\\s\\S]*?<Nominal>(\\d+)<\\/Nominal>[\\s\\S]*?<Value>([\\d,]+)<\\/Value>`
    );
    const match = xml.match(re);
    if (!match) throw new Error(`Failed to parse ${charCode} from CBR XML`);
    const nominal = parseInt(match[1], 10);
    const value = parseFloat(match[2].replace(',', '.'));
    return value / nominal; // RUB per 1 unit of currency
  }

  const rubPerUsd = parseValute('USD'); // e.g. 91.52 RUB per 1 USD
  const rubPerAmd = parseValute('AMD'); // e.g. 0.235 RUB per 1 AMD
  const amdPerUsd = rubPerUsd / rubPerAmd; // e.g. 389.4 AMD per 1 USD

  return {
    USD: 1,
    RUB: parseFloat(rubPerUsd.toFixed(4)),
    AMD: parseFloat(amdPerUsd.toFixed(2)),
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const now = Date.now();

  // Return cached rates if still fresh
  if (ratesCache && (now - lastFetchTime < CACHE_DURATION)) {
    return res.json({ success: true, source: 'cbr', ...ratesCache });
  }

  try {
    const rates = await fetchCBRRates();
    ratesCache = {
      rates,
      time_last_update_utc: new Date().toUTCString(),
    };
    lastFetchTime = now;
    res.json({ success: true, source: 'cbr', ...ratesCache });
  } catch (error) {
    console.error('CBR fetch error:', error.message);

    // Serve stale cache if available
    if (ratesCache) {
      console.warn('Returning stale cached CBR rates.');
      return res.json({ success: true, source: 'cbr_stale', ...ratesCache });
    }

    res.status(500).json({ success: false, error: 'Could not fetch rates from CBR' });
  }
};
