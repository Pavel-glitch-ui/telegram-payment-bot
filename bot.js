require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const channelId = process.env.CHANNEL_ID;


bot.start((ctx) => {
  ctx.reply("🎉 Привет! Оплати доступ к приватному каналу:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "💳 Оплатить 100 руб.", callback_data: "init_pay" }] 
      ]
    }
  });
});

// pay button
bot.action('init_pay', (ctx) => {
  const userId = ctx.from.id;
  ctx.replyWithInvoice({
    title: 'Доступ к приватному каналу',
    description: 'После оплаты вы получите доступ к закрытому Telegram-каналу',
    payload: `channel_access_${userId}_${Date.now()}`, 
    provider_token: process.env.PAYMENT_PROVIDER_TOKEN,
    currency: 'RUB',
    prices: [{ label: "Доступ к каналу", amount: 10000 }], 
  });
});


bot.on('pre_checkout_query', (ctx) => {
  
  ctx.answerPreCheckoutQuery(true);
});


bot.on('successful_payment', async (ctx) => {
  const userId = ctx.from.id;
  try {
    
    await ctx.telegram.restrictChatMember(channelId, userId, {
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true
    });
    
    await ctx.reply('✅ Оплата прошла успешно! Теперь у вас есть доступ к каналу.');
    await ctx.telegram.sendMessage(channelId, `Пользователь @${ctx.from.username} (${ctx.from.first_name}) получил доступ.`);
  } catch(err) {
    console.error('Ошибка при добавлении в канал:', err);
    await ctx.reply('❌ Произошла ошибка. Свяжитесь с @администратор.');
    
    
    await ctx.telegram.sendMessage(
      process.env.ADMIN_ID, 
      `Ошибка доступа для ${ctx.from.id}:\n${err.message}`
    );
  }
});


bot.catch((err, ctx) => {
  console.error('Ошибка бота:', err);
  ctx.telegram.sendMessage(process.env.ADMIN_ID, `Ошибка бота: ${err.message}`);
});


bot.launch()
  .then(() => console.log('Бот успешно запущен!'))
  .catch(err => console.error('Ошибка запуска:', err));


process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));