const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MINI_APP_URL = process.env.MINI_APP_URL || `http://localhost:${PORT}`;

app.use(express.static(path.join(__dirname, 'public')));

// Cache for currency rates
let ratesCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchCBRRates() {
  const response = await axios.get('https://www.cbr.ru/scripts/XML_daily.asp', {
    responseType: 'text',
    timeout: 10000,
    headers: { 'Accept-Charset': 'windows-1251' },
  });

  const xml = response.data;
  
  function parseValute(charCode) {
    const re = new RegExp(
      `<CharCode>${charCode}<\\/CharCode>[\\s\\S]*?<Nominal>(\\d+)<\\/Nominal>[\\s\\S]*?<Value>([\\d,]+)<\\/Value>`
    );
    const match = xml.match(re);
    if (!match) throw new Error(`Failed to parse ${charCode} from CBR XML`);
    const nominal = parseInt(match[1], 10);
    const value = parseFloat(match[2].replace(',', '.'));
    return value / nominal;
  }

  const rubPerUsd = parseValute('USD');
  const rubPerAmd = parseValute('AMD');
  const rubPerUah = parseValute('UAH');
  const amdPerUsd = rubPerUsd / rubPerAmd;
  const uahPerUsd = rubPerUsd / rubPerUah;

  return {
    USD: 1,
    RUB: parseFloat(rubPerUsd.toFixed(4)),
    AMD: parseFloat(amdPerUsd.toFixed(2)),
    UAH: parseFloat(uahPerUsd.toFixed(2)),
  };
}

async function getRates() {
  const now = Date.now();
  if (ratesCache && (now - lastFetchTime < CACHE_DURATION)) {
    return ratesCache;
  }

  console.log('Fetching fresh exchange rates from CBR...');
  try {
    const rates = await fetchCBRRates();
    ratesCache = {
      rates,
      time_last_update_utc: new Date().toUTCString()
    };
    lastFetchTime = now;
    return ratesCache;
  } catch (error) {
    console.error('Error fetching currency rates:', error.message);
    if (ratesCache) {
      console.log('Returning stale cached rates.');
      return ratesCache;
    }
    throw error;
  }
}

// API endpoint for frontend to fetch rates
app.get('/api/rates', async (req, res) => {
  try {
    const data = await getRates();
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not fetch rates' });
  }
});

// Start Express Web Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Web Server is running on: http://localhost:${PORT}`);
  console.log(`📂 Serving Mini App frontend from 'public/' folder`);
  console.log(`==================================================`);
});

// Setup Telegram Bot
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken || botToken === 'YOUR_BOT_TOKEN_HERE') {
  console.log('⚠️ TELEGRAM_BOT_TOKEN is not configured or set to default.');
  console.log('⚠️ Bot interface will NOT start. Run in local browser mode instead:');
  console.log(`👉 Open http://localhost:${PORT} directly in your browser to preview the UI.`);
  console.log('==================================================');
} else {
  const bot = new Telegraf(botToken);

  bot.start(async (ctx) => {
    const userName = ctx.from.first_name || 'друг';
    const welcomeText = `Привет, ${userName}! 👋\n\nДобро пожаловать в **Конвертер валют**!\n\nНажмите на кнопку ниже, чтобы открыть Telegram Mini App с удобным и современным интерфейсом для перевода между USD, RUB и AMD в реальном времени.`;

    const inlineKeyboard = Markup.inlineKeyboard([
      Markup.button.webApp('💰 Открыть Конвертер', MINI_APP_URL)
    ]);

    const replyKeyboard = Markup.keyboard([
      [Markup.button.webApp('💰 Открыть Конвертер', MINI_APP_URL)]
    ]).resize();

    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      ...replyKeyboard
    });
  });

  bot.launch()
    .then(() => {
      console.log('🤖 Telegram Bot started successfully!');
      console.log(`🔗 Mini App URL configured as: ${MINI_APP_URL}`);
      console.log('==================================================');
    })
    .catch((err) => {
      console.error('❌ Failed to start Telegram Bot:', err.message);
    });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
