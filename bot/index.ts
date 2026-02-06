import { Telegraf, Markup, session, Scenes } from 'telegraf';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is not defined in .env file');
  (process as any).exit(1);
}

const bot = new Telegraf<any>(process.env.BOT_TOKEN);

// --- SCENES (Wizards for multi-step calculations) ---

// 1. Discount Calculator Scene
const discountWizard = new Scenes.WizardScene(
  'discount-wizard',
  (ctx) => {
    ctx.reply('Введите исходную цену (например: 1000):');
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return ctx.reply('Пожалуйста, введите число.');
    const price = parseFloat(ctx.message.text.replace(',', '.'));
    if (isNaN(price)) return ctx.reply('Это не число. Попробуйте снова.');
    
    ctx.wizard.state.data.price = price;
    ctx.reply('Введите процент скидки (например: 20):');
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return ctx.reply('Пожалуйста, введите число.');
    const discount = parseFloat(ctx.message.text.replace(',', '.'));
    if (isNaN(discount)) return ctx.reply('Это не число. Попробуйте снова.');

    const price = ctx.wizard.state.data.price;
    const finalPrice = price * (1 - discount / 100);
    const saved = price - finalPrice;

    ctx.reply(
      `💰 *Результат:*\n` +
      `Цена без скидки: ${price}\n` +
      `Скидка: ${discount}%\n` +
      `------------------\n` +
      `✅ *Итого: ${finalPrice.toFixed(2)}*\n` +
      `Вы экономите: ${saved.toFixed(2)}`,
      { parse_mode: 'Markdown' }
    );
    return ctx.scene.leave();
  }
);

// 2. Promo N+X Scene
const promoWizard = new Scenes.WizardScene(
  'promo-wizard',
  (ctx) => {
    ctx.reply('Введите цену за одну единицу товара (базовая цена):');
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return ctx.reply('Введите число.');
    const price = parseFloat(ctx.message.text.replace(',', '.'));
    if (isNaN(price)) return;
    ctx.wizard.state.data.price = price;
    
    ctx.reply('Сколько нужно купить (N)? (например: 3)');
    return ctx.wizard.next();
  },
  (ctx) => {
    const n = parseFloat(ctx.message?.text || '0');
    ctx.wizard.state.data.n = n;
    ctx.reply('Сколько дают в подарок (X)? (например: 1)');
    return ctx.wizard.next();
  },
  (ctx) => {
    const x = parseFloat(ctx.message?.text || '0');
    const { price, n } = ctx.wizard.state.data;
    
    const totalQty = n + x;
    const totalPrice = price * n;
    const pricePerItem = totalQty > 0 ? totalPrice / totalQty : 0;
    const realDiscount = totalQty > 0 ? (x / totalQty) * 100 : 0;

    ctx.reply(
      `🎁 *Акция ${n}+${x}*\n` +
      `Цена за 1 шт (по акции): *${pricePerItem.toFixed(2)}*\n` +
      `Реальная скидка: *${realDiscount.toFixed(1)}%*\n` +
      `Общая стоимость за ${totalQty} шт: ${totalPrice}`,
      { parse_mode: 'Markdown' }
    );
    return ctx.scene.leave();
  }
);

// 3. Currency Scene
const currencyWizard = new Scenes.WizardScene(
  'currency-wizard',
  (ctx) => {
    ctx.reply('Какую валюту конвертировать в Гривну? (Введите код, например: USD, EUR, PLN)');
    return ctx.wizard.next();
  },
  async (ctx) => {
    const currency = ctx.message?.text?.toUpperCase();
    ctx.wizard.state.currency = currency;
    
    // Check if currency exists roughly
    if (currency.length !== 3) {
      ctx.reply('Код валюты должен состоять из 3 букв. Попробуйте /currency снова.');
      return ctx.scene.leave();
    }

    ctx.reply(`Введите сумму в ${currency}:`);
    return ctx.wizard.next();
  },
  async (ctx) => {
    const amount = parseFloat(ctx.message?.text?.replace(',', '.') || '0');
    if (isNaN(amount)) return ctx.reply('Неверная сумма.');
    
    const currency = ctx.wizard.state.currency;

    try {
        ctx.reply('🔍 Загружаю курс НБУ...');
        const response = await axios.get(`https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${currency}&json`);
        
        if (response.data && response.data.length > 0) {
            const rate = response.data[0].rate;
            const result = amount * rate;
            ctx.reply(
                `💱 *Конвертация*\n` +
                `Курс НБУ: 1 ${currency} = ${rate.toFixed(4)} UAH\n` +
                `------------------\n` +
                `✅ *${amount} ${currency} = ${result.toFixed(2)} UAH*`,
                { parse_mode: 'Markdown' }
            );
        } else {
            ctx.reply('Не удалось найти курс для этой валюты.');
        }
    } catch (e) {
        ctx.reply('Ошибка соединения с банком.');
    }
    return ctx.scene.leave();
  }
);

// --- SETUP ---

const stage = new Scenes.Stage([discountWizard, promoWizard, currencyWizard]);
bot.use(session());
bot.use(stage.middleware());

// --- COMMANDS ---

bot.start((ctx) => {
  ctx.reply(
    '👋 Привет! Я бот-калькулятор покупок.\nВыберите функцию:',
    Markup.keyboard([
      ['🏷 Скидка', '🎁 Акция N+X'],
      ['💱 Курс валют', '⚖️ Цена за КГ']
    ]).resize()
  );
});

bot.hears('🏷 Скидка', (ctx) => ctx.scene.enter('discount-wizard'));
bot.hears('🎁 Акция N+X', (ctx) => ctx.scene.enter('promo-wizard'));
bot.hears('💱 Курс валют', (ctx) => ctx.scene.enter('currency-wizard'));

bot.hears('⚖️ Цена за КГ', (ctx) => {
    // Simple enough to do without a wizard for now, or just explain
    ctx.reply('Для расчета цены за КГ:\nОтправьте сообщение в формате: "цена вес"\nНапример: "50 200" (50 грн за 200г)');
});

// Simple regex handler for "Price per KG" quick calc
bot.hears(/^(\d+([.,]\d+)?)\s+(\d+([.,]\d+)?)$/, (ctx) => {
    const parts = ctx.message.text.replace(',', '.').split(/\s+/);
    const price = parseFloat(parts[0]);
    const weight = parseFloat(parts[1]); // Assuming grams

    if (weight === 0) return;

    // Assume weight is grams if > 5, else kg. Heuristic.
    let isGrams = weight > 5;
    
    // Normalized to 1 KG
    const pricePerKg = isGrams ? (price / weight) * 1000 : (price / weight);

    ctx.reply(
        `⚖️ *Цена за единицу*\n` +
        `Ввод: ${price} за ${weight}${isGrams ? 'г' : 'кг'}\n` +
        `------------------\n` +
        `✅ *Цена за 1 КГ: ${pricePerKg.toFixed(2)}*`
    , { parse_mode: 'Markdown' });
});

// Launch
bot.launch(() => {
    console.log('🤖 Бот запущен! Нажмите Ctrl+C для остановки.');
});

// Enable graceful stop
(process as any).once('SIGINT', () => bot.stop('SIGINT'));
(process as any).once('SIGTERM', () => bot.stop('SIGTERM'));
