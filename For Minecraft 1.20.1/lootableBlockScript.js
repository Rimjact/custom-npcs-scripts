/*
=========== Скрипт для создания лутаемого блока ===========
Описание:

Данный скрипт работает на Custom NPCs Minecraft 1.20.1. Суть скрипта - добавить скриптовому
блоку возможность выдавать случайный лут из массива с отображением прогресса "поиска предметов".
Вставьте скрипт в новую вкладку и настройте по своему вкусу.
-----------
Автор скрипта: Kirill "Rimjact" Tolokolnikov

© Rimjact, 2025
==========================================================
*/


// ==== НАСТРОЙКИ ====
/*
Список предметов, которые могут быть выданы игроку.
    id - идентификатор предмета;
    chance - шанс выдачи предмета (в процентах);
    count - количество,
    range - дипазон для генератора чисел (не изменять)

Для того, чтобы добавить новые предметы для выдачи,
скопируйте один из объектов "{...}," (обязательно
с запятой) и вставьте скопированный код с новой строки.

!ВАЖНО! Сумма шансов всех предметов должна быть равной 100.
*/
var items = [
    {
        id: 'minecraft:wooden_axe{custom_tag:1,custom_tag2:true,custom_tag3:"ok"}',
        chance: 55,
        count: 1,
        range: {
            min: 0,
            max: 0
        }
    },
    {
        id: 'minecraft:stone_axe',
        chance: 25,
        count: 1,
        range: {
            min: 0,
            max: 0
        }
    },
    {
        id: 'minecraft:iron_axe',
        chance: 15,
        count: 1,
        range: {
            min: 0,
            max: 0
        }
    },
    {
        id: 'minecraft:diamond_axe',
        chance: 5,
        count: 1,
        range: {
            min: 0,
            max: 0
        }
    },
];

// Интервал для восстановления хранилища (в секундах) (1 секунда = 20 тиков)
var cooldown = 4;

// Сколько добавится прогресса за каждый клик ПКМ.
var progressCountByClick = 25;

/*
Текст для отображения прогресса.
Можно добавить цвета.
Вместо "{0}" будет подставлено значение прогресса.
*/
var progressText = "*вы ищете предметы* \u00A79 {0}% \u00A7f";
// Текст для заполненного хранилища (когда интервал прошел).
var filledText = "*копаясь, вы что-то нашли*";
// Текст для пустого хранилища (когда интервал не прошел).
var emptyText = "*вы ничего не нашли*";

// Модель скриптового блока.
var blockModel = "minecraft:barrel";

// Название ресурса звука для прогресса поиска.
var progressSound = "block.wood.hit";


// ==== ФУНКЦИОНАЛ ====
// Модфицируйте код ниже на свой страх и риск.
var errorSumText = "ОШИБКА! Сумма шансов не равна 100!";
var errorRangeText = "ОШИБКА! Ни один предмет не подошёл под текущее случайное значение.";

// Custom NPCs API функция, которая срабатывает при инициализации блока.
function init(e) {
    var block = e.block;

    if (getSumOfItemsChanses() != 100) {
        viewHintForPlayer(block, errorSumText);
        return;
    }

    block.setModel(blockModel);
    block.setRotation(0, 0, 0);
    block.setHardness(-1);

    setupTempData(block.getTempdata());
    setupRangesForItems();
}

// Custom NPCs API функция, которая срабатывает при взаимодействии с блоком.
function interact(e) {
    var block = e.block;
    var player = e.player;

    if (getSumOfItemsChanses() != 100) {
        viewHintForPlayer(block, errorSumText);
        return;
    }

    makeProgress(block, player);
    var curProgress = block.getTempdata().get('progress');
    if (curProgress >= 100)
        onProgressDone(block);
}

// Custom NPCs API функция, которая срабатывает при завершении любого таймера.
function timer(e) {
    var blockTempData = e.block.getTempdata();
    var timerId = e.id;
    switch (timerId) {
        case 1:
            onCooldownTimerFinished(blockTempData);
            break;
    }
}

// Добавляет прогресс.
function makeProgress(block, player) {
    var blockTempData = block.getTempdata();

    var curProgress = blockTempData.get('progress');
    var newProgress = curProgress + progressCountByClick;

    blockTempData.put('progress', newProgress)
    viewHintForPlayer(block, progressText.replace('{0}', newProgress))

    player.playSound(progressSound, 0.5, 1)
}

// Когда прогресс завершён.
function onProgressDone(block) {
    var blockTempData = block.getTempdata();

    blockTempData.put('progress', 0);

    if (isEmpty(blockTempData)) {
        viewHintForPlayer(block, emptyText);
        return;
    }

    blockTempData.put('empty', true);

    giveRandomItemForPlayer(block);

    block.getTimers().forceStart(1, cooldown * 20, false);
}

function onCooldownTimerFinished(blockTempData) {
    blockTempData.put('empty', false);
}

// Выдаёт случайный предмет для игрока.
function giveRandomItemForPlayer(block) {
    var randomNum = getRandomInt(1, 100);

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var range = item.range;

        if (randomNum >= range.min && randomNum <= range.max) {
            block.executeCommand('/give @p ' + item.id + ' ' + item.count);
            viewHintForPlayer(block, filledText);
            return;
        }
    }

    viewHintForPlayer(block, errorRangeText);
}

// Показывает текст на экране игрока.
function viewHintForPlayer(block, text) {
    block.executeCommand('/title @p actionbar {"text":"'+ text +'"}');
}

// Устанавливает диапазоны чисел для предметов на основе шанса.
function setupRangesForItems() {
    var curRangeMax = 0;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var range = getRangeForItem(item, curRangeMax);
        curRangeMax = range.max;
        setItemRange(item, range);
    }
}

// Устанавливает начальные значения во временное храналище данных.
function setupTempData(blockTempData) {
    if (!blockTempData.has('progress'))
        blockTempData.put('progress', 0);

    if (!blockTempData.has('empty'))
        blockTempData.put('empty', false);
}

// Проверяет, пустое ли хранилище (не прошел интвервал).
function isEmpty(blockTempData) {
    return blockTempData.get('empty');
}

// Проверяет, является ли сумма диапазонов предметов неверной.
function isItemsRangesSumIncorrect(sum) {
    return sum != 100;
}

// Устанавливает диапазон для предмета.
function setItemRange(item, range) {
    var itemRange = item.range;
    itemRange.min = range.min;
    itemRange.max = range.max;
}

// Возвращает кортеж диапазона чисел для случайной выдачи предмета.
function getRangeForItem(item, prevRangeMax) {
    var itemChance = item.chance;
    var range = {
        min: prevRangeMax + 1,
        max: prevRangeMax + itemChance
    }

    return range;
}

// Генерирует случайное значение по заданному диапазону.
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Считает и возвращает сумму шансов текущего списка предметов.
function getSumOfItemsChanses() {
    var sum = 0;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        sum += item.chance;
    }

    return sum;
}