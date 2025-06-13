module.exports = (bot, options) => {
    const log = bot.sendLog;
    const settings = options.settings;

    let tasks = [];
    try {
        const tasksData = typeof settings.tasks === 'string' 
            ? JSON.parse(settings.tasks) 
            : settings.tasks;

        if (!Array.isArray(tasksData)) throw new Error('Настройка "tasks" должна быть массивом.');
        tasks = tasksData.filter(task => task.active === true);
    } catch (e) {
        log(`[WelcomeMessage] Ошибка: Неверный формат настройки "tasks". ${e.message}`);
        return;
    }

    if (tasks.length === 0) {
        log('[WelcomeMessage] Нет активных заданий для приветствий.');
        return;
    }

    const userTaskMap = new Map();
    tasks.forEach(task => {
        if (task.targetUsers && Array.isArray(task.targetUsers)) {
            task.targetUsers.forEach(user => {
                userTaskMap.set(user.toLowerCase(), task);
            });
        }
    });

    log(`[WelcomeMessage] Плагин загружен. Активно ${tasks.length} заданий, отслеживается ${userTaskMap.size} уникальных игроков.`);

    let isActivated = false;
    let activationTimeout;

    const onPlayerJoined = (player) => {
        const usernameLower = player.username.toLowerCase();
        
        const task = userTaskMap.get(usernameLower);

        if (task) {
            const messages = task.messages || [];
            if (messages.length === 0) return;

            const messageTemplate = messages[Math.floor(Math.random() * messages.length)];
            const finalMessage = messageTemplate.replace(/{username}/g, player.username);

            log(`[WelcomeMessage] Игрок ${player.username} зашел (задание: "${task.taskName}"). Отправка приветствия.`);
            
            bot.api.sendMessage('chat', finalMessage);
        }
    };

    activationTimeout = setTimeout(() => {
        isActivated = true;
        bot.on('playerJoined', onPlayerJoined);
        log('[WelcomeMessage] Плагин активирован и готов приветствовать игроков.');
    }, 15000);

    bot.once('end', () => {
        clearTimeout(activationTimeout);
        if (isActivated) {
            bot.removeListener('playerJoined', onPlayerJoined);
        }
        log('[WelcomeMessage] Плагин выгружен.');
    });
};