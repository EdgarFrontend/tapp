const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MINI_APP_URL = process.env.MINI_APP_URL || `http://localhost:${PORT}`;

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Cache for currency rates to prevent API rate limiting
let ratesCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function getRates() {
  const now = Date.now();
  if (ratesCache && (now - lastFetchTime < CACHE_DURATION)) {
    return ratesCache;
  }

  console.log('Fetching fresh exchange rates...');
  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    if (response.data && response.data.result === 'success') {
      ratesCache = {
        rates: {
          USD: response.data.rates.USD,
          RUB: response.data.rates.RUB,
          AMD: response.data.rates.AMD
        },
        time_last_update_utc: response.data.time_last_update_utc
      };
      lastFetchTime = now;
      return ratesCache;
    } else {
      throw new Error('Failed to get success status from ExchangeRate API');
    }
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

    // Send a message with an Inline Button to launch the Web App
    const inlineKeyboard = Markup.inlineKeyboard([
      Markup.button.webApp('💰 Открыть Конвертер', MINI_APP_URL)
    ]);

    // Send a message with a Reply Keyboard (which stays as a persistent button)
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

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
