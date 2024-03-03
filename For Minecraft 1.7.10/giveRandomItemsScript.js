/*
=========== Скрипт выдачи случайных предметов с шансом ===========
Описание:

Данный скрипт работает на Custom NPCs Minecraft 1.7.10. Суть скрипта - выдача через взаимодействие с NPC случайного предмета
из списка itemsForGive. Каждый элемент списка - объект с информацией о предмете, количистве и диапазоном для генератора рандомного целого числа.
Вставить код скрипта требуется в хук "Взаимодействие" (или же "Interaction", "Инициализация" (кривой перевод)) используя инструмент мода "Сценарист".
Скрипт масштабируемый - можно добавлять множество предметов в список с разными диапазонами, а также простой в настройке.
-----------
Автор скрипта: Kirill "Rimjact" Tolokolnikov

© Rimjact (03.03.2024)
==================================================================
*/

// ================== НАСТРОЙКИ ==================
/*
Список предметов для выдачи игроку. Каждый { id: "...", minNum: 1, maxNum: 2, count: 1 } — объект предмета с информацие о выдаче:
id - идентификатор предмета (например "minecraft:stone" - блок камня);
minNum - минимальное значение диапазона для генератора чисел;
maxNum - максимальное значение диапазона для генератора чисел;
Разницой между maxNum и minNum будет шанс выпадения предмета (например для блока камня maxNum - minNum + 1 = 50% шанс выпадения (+ 1 потому-что диапазон включительно охватывает эти значения).
count - количество этого предмета для выдачи.
*/
var itemsForGive = [
    {
        id: "minecraft:stone",
        minNum: 1,
        maxNum: 50,
        count: 1
    },
    {
        id: "minecraft:diamond_ore",
        minNum: 51,
        maxNum: 75,
        count: 1
    },
    {
        id: "minecraft:gold_ore",
        minNum: 76,
        maxNum: 100,
        count: 1
    }
];
// Диапазон для генератора случайного целого числа
var randRangeMin = 1, randRangeMax = 100;

// Время ожидания повторной выдачи в секундах (1 реальная секунда = 20 игровых тиков)
var giveCooldown = 5;

// Сообщения для вывода в чат от NPC. giveMessage - если предмет выдан, emptyMessage - когда время ещё не прошло.
var giveMessage = "*копаясь вы что-то нашли в хранилище*", emptyMessage = "*хранилище пусто*";

// ================== ФУНКЦИОНАЛ ==================

// Выдаёт случайный предмет игроку
function givePlayerRandomItem() {
    // Проверяем, прошло ли нужное количество времени
    if (!isCooldownElepsed(world.getTotalTime())) {
        npc.say(emptyMessage); // если нет, говорим что "хранилище пусто" и завершаем выполнение функции
        return;
    } 

    var randomNum = getRandomInt(randRangeMin, randRangeMax); // Генерируем случайное значение
 
    for (var i = 0; i < itemsForGive.length; i++) {
        var curItem = itemsForGive[i]; // Текущий предмет в цикле из списка
        
        // Если сгененированное значение попадает в диапазон предмета из таблицы
        if (randomNum >= curItem.minNum && randomNum <= curItem.maxNum) {
            player.giveItem(curItem.id, 0, curItem.count); // выдаём этот предмет игроку
            
            npc.setTempData("lastGiveTime", world.getTotalTime()); // устанавливаем, что предмет был получен

            npc.say(giveMessage); // уведомляем игрока

            break; // прерываем цикл
        }
    }
}

// Генерирует случайное число по заданному диапазону (источник: Mozilla Developer Network page example)
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Проверяет прошло ли N секунд с момента последней выдачи. Вернёт true если прошло, в противном случае false
function isCooldownElepsed(curTotalTime) {
    // Проверяем значение lastGiveTime во временных данных NPC, если не содержится, устанавливаем как ноль
    if (!npc.hasTempData("lastGiveTime")) npc.setTempData("lastGiveTime", world.getTotalTime());

    // Вычитаем текущее и время последнего получения предмета, чтобы получить прошедшее время в тиках и сверять с временем ожидания
    return curTotalTime - npc.getTempData("lastGiveTime") >= giveCooldown * 20;
}

// Вызываем функцию выдачи предмета при взаимодействии (вызывается хуком)
givePlayerRandomItem();