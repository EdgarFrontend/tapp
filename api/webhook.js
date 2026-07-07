const { Telegraf } = require('telegraf');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const miniAppUrl = process.env.MINI_APP_URL;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return res.status(500).send('Bot token not configured');
  }

  try {
    const bot = new Telegraf(botToken);

    bot.start(async (ctx) => {
      const userName = ctx.from.first_name || 'друг';
      const welcomeText = `Привет, ${userName}! 👋\n\nДобро пожаловать в **Конвертер валют**!\n\nНажмите на кнопку ниже, чтобы открыть Telegram Mini App с удобным и современным интерфейсом для перевода между USD, RUB и AMD в реальном времени.`;

      await ctx.reply(welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '💰 Открыть Конвертер', web_app: { url: miniAppUrl } }],
          ],
          resize_keyboard: true,
        },
      });
    });

    // Handle the update from Telegram
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};
