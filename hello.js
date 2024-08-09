const TelegramBot =  require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const { insertUser, db} = require('./database');

const token = '7481897148:AAE1vXk3n6q5xW59gRhCBoCf0OH-vjwNEFU';
const bot = new TelegramBot(token, {polling: true});
const CHANNEL_LINK = 'https://t.me/+T4XSGbii5lAzYWEy';
const authorizedUsers = [1082446304, 1337217971];
let waitingForMessage = false;
let targetCategory = null;

bot.on('chat_join_request', (msg) => {
    const userId = msg.from.id;
    const firstName = msg.from.first_name;

    const welcomeMessage = `${firstName}, подтвердите, что вы не робот.`;

    const options = {
        reply_markup: {
            keyboard: [
                [{ text: '🤖 Я человек' }]
            ],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    bot.sendMessage(userId, welcomeMessage, options).catch(error => {
        console.error('Ошибка при отправке сообщения пользователю:', error);
    });
});

// Обработка нажатия на кнопку "Я человек"
bot.on('message', (msg) => {
    const userId = msg.from.id;
    const text = msg.text;

    if (text === '🤖 Я человек') {
        const categoryMessage = `Выберите, пожалуйста, категорию, в качестве кого вы хотите попасть в наше закрытое комьюнити?`;

        const categoryOptions = {
            reply_markup: {
                keyboard: [
                    [{ text: '💼 Инвестор (действующий)' }],
                    [{ text: '🚀 Предприниматель | начинающий инвестор' }],
                    [{ text: '🏢 Агент по недвижимости' }]
                ],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        };

        bot.sendMessage(userId, categoryMessage, categoryOptions).catch(error => {
            console.error('Ошибка при отправке сообщения с категориями:', error);
        });
    } else if (
        text === '💼 Инвестор (действующий)' ||
        text === '🚀 Предприниматель | начинающий инвестор' ||
        text === '🏢 Агент по недвижимости'
    ) {
        insertUser(userId, text);

        const contentMessage = `Для совершенствования нашего контента выберите, пожалуйста, рубрики, которые вам будут интересны:`;

        const contentOptions = {
            reply_markup: {
                keyboard: [
                    [{ text: '🏗️ Кейсы с реализованными объектами' }],
                    [{ text: '📈 Витрина лотов с потенциальным инвестированием' }],
                    [{ text: '📰 Новости в сфере недвижимости' }],
                    [{ text: '🏡 Лайфстайл компании' }],
                    [{ text: '🎙️ Подкасты с нашими действующими инвесторами' }],
                    [{ text: '😂 Больше мемов!' }],
                    [{ text: '📊 Прогнозы и аналитика в недвижимости' }]
                ],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        };

        // Сохраняем время отправки сообщения
        const now = Date.now();
        const timeoutDuration = 60000; // 60 секунд
        const timeout = setTimeout(() => {
            bot.sendMessage(userId, `Благодарим вас за ожидание, Ваша заявка на вступление принята\n\nВам представлен доступ в канал ТРИИНВЕСТ, где рассказываем как увеличить ваш доход, публикуя горячие предложения\n\n${CHANNEL_LINK}`);
        }, timeoutDuration);

        bot.sendMessage(userId, contentMessage, contentOptions).then(() => {
            bot.on('message', (response) => {
                if (response.from.id === userId) {
                    if (
                        response.text === '🏗️ Кейсы с реализованными объектами' ||
                        response.text === '📈 Витрина лотов с потенциальным инвестированием' ||
                        response.text === '📰 Новости в сфере недвижимости' ||
                        response.text === '🏡 Лайфстайл компании' ||
                        response.text === '🎙️ Подкасты с нашими действующими инвесторами' ||
                        response.text === '😂 Больше мемов!' ||
                        response.text === '📊 Прогнозы и аналитика в недвижимости'
                    ) {
                        clearTimeout(timeout);
                        bot.sendMessage(userId, `Благодарим вас за ответ! Ваша заявка на вступление принята\n\nВам представлен доступ в канал ТРИИНВЕСТ, где рассказываем как увеличить ваш доход, публикуя горячие предложения\n\n${CHANNEL_LINK}`);
                    }
                }
            });
        }).catch(error => {
            console.error('Ошибка при отправке сообщения с рубриками:', error);
        });
    }
});

bot.onText(/\/send/, (msg) => {
    const userId = msg.from.id;

    if (authorizedUsers.includes(userId)) {
        const categoryMessage = `Выберите категорию пользователей, чтобы отправить им сообщение:`;

        const categoryOptions = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💼 Инвестор (действующий)', callback_data: 'investor' }],
                    [{ text: '🚀 Предприниматель | начинающий инвестор', callback_data: 'entrepreneur' }],
                    [{ text: '🏢 Агент по недвижимости', callback_data: 'agent' }]
                ]
            }
        };

        bot.sendMessage(userId, categoryMessage, categoryOptions).catch(error => {
            console.error('Ошибка при отправке сообщения с категориями:', error);
        });

        waitingForMessage = true;
    } else {
        bot.sendMessage(userId, "У вас нет прав на выполнение этой команды.");
    }
});

// Обработка нажатия на inline-кнопку
bot.on('callback_query', (callbackQuery) => {
    const userId = callbackQuery.from.id;
    targetCategory = callbackQuery.data;

    if (waitingForMessage) {
        bot.sendMessage(userId, `Теперь отправьте сообщение, которое вы хотите отправить пользователям в категории.`);
    }
});

// Обработка следующего сообщения после /send
bot.on('message', (msg) => {
    const userId = msg.from.id;

    if (waitingForMessage && authorizedUsers.includes(userId) && targetCategory) {
        const messageToSend = msg.text;
        let categoryText;

        switch (targetCategory) {
            case 'investor':
                categoryText = '💼 Инвестор (действующий)';
                break;
            case 'entrepreneur':
                categoryText = '🚀 Предприниматель | начинающий инвестор';
                break;
            case 'agent':
                categoryText = '🏢 Агент по недвижимости';
                break;
            default:
                categoryText = null;
        }

        if (categoryText) {
            // Получаем всех пользователей из базы данных с выбранной категорией
            db.all("SELECT telegram_id FROM users WHERE category = ?", [categoryText], (err, rows) => {
                if (err) {
                    console.error('Ошибка при получении пользователей из базы данных:', err.message);
                    return;
                }

                // Отправляем сообщение всем пользователям в выбранной категории
                rows.forEach((row) => {
                    bot.sendMessage(row.telegram_id, messageToSend);
                });

                bot.sendMessage(userId, `Сообщение отправлено пользователям в категории "${categoryText}".`);
            });
        }

        // Сбрасываем флаги после отправки сообщения
        waitingForMessage = false;
        targetCategory = null;
    }
});

const app = express();
app.use(bodyParser.json());

app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});