/*
=========== Простой скрипт блока руды ===========
Описание:

Данный скрипт работает на Custom NPCs Minecraft 1.20.1. Суть скрипта - дать возможность скриптовому блоку
выдавать руду в определённом количестве. Выдача происходит по кулдауну. Для взаимодействия нужна определённая
кирка, а при взаимодействии выводит прогресс игроку на экран.
-----------
Автор скрипта: Kirill "Rimjact" Tolokolnikov

© Rimjact, 2025
==========================================================
*/

// ==== НАСТРОЙКИ ====
// Предмет руды, который будет выдан игроку.
var oreItem = {
    id: 'minecraft:raw_iron',
    count: 1
};
// Модель (блок) руды.
var oreModel = 'minecraft:iron_ore';
// Модель (блок) камня (когда жила истощена).
var emptyModel = 'minecraft:stone';

// Разрешённые инструменты (например, кирки) для добычи.
var allowedInstruments = [
    'minecraft:stone_pickaxe',
    'minecraft:iron_pickaxe',
    'minecraft:diamond_pickaxe'
];

// Интервал для восстановления жилы (в секундах) (1 секунда = 20 тиков).
var cooldown = 5;
// Интервал между взаимодействиями (повышением прогресса) (в секундах).
var interactColdown = 1;

// Сколько будет нанесено урона предмету после того, как процесс добычи завершится.
var instrumentDamageByHarvest = 10;

// Сколько добавится прогресса за каждое взаимодействие с блоком.
var progressCountByInteract = 25;

// Текст для вывода, когда инструмент в руке игрока не подходит.
var notAllowedInstrumentText = '*нужен подходящий инструмент*';
// Текст для отображения прогресса (поддерживает цвета) ({0} не удалять).
var progressText = '*вы копаете руду* \u00A79 {0}% \u00A7f';
// Текст для вывода, когда игрок выкопал руду.
var harvestText = '*вы истощили жилу*';
// Текст для вывода, когда жила истощена (кулдаун не прошел).
var emptyText = '*жила истощена*';

// Название звука для проигрывания во время повышения прогресса.
var progressSound = 'minecraft:block.stone.break';
// Название звука для проигрывания, когда инструмент в руке игрока поломался.
var instrumentBreakSound = 'minecraft:entity.item.break';


// ==== ФУНКЦИОНАЛ ====
// Модифицируйте код ниже на свой страх и риск.

// Custom NPCs API функция, которая срабатывает при инициализации блока.
function init(e) {
    var block = e.block;
    block.setModel(oreModel);
    block.setRotation(0, 0, 0);
    block.setHardness(-1);

    setupTempdata(block.getTempdata());
}

// Custom NPCs API функция, которая срабатывает при взаимодействии с блоком.
function interact(e) {
    var player = e.player;
    var block = e.block;
    var blockTempdata = block.getTempdata();
    var mainhandItem = player.mainhandItem;

    if (!isInstrumentAllowed(mainhandItem.name)) {
        viewHintForPlayer(block, notAllowedInstrumentText);
        return;
    }

    if (isEmpty(blockTempdata)) {
        viewHintForPlayer(block, emptyText);
        return;
    }

    if (isInteractBlocked(blockTempdata))
        return;

    makeProgress(block, player);
    var curProgress = blockTempdata.get('progress');
    if (curProgress == 100)
        onProgressDone(block, player, mainhandItem);
}

// Custom NPCs API функция, которая срабатывает при завершении любого таймера.
function timer(e) {
    var block = e.block;
    var blockTempdata = block.getTempdata();
    var timerId = e.id;
    switch (timerId) {
        case 1:
            onCooldownTimerFinished(block);
            break;
        case 2:
            onCooldownInteractFinished(blockTempdata);
            break;
    }
}

// Добавляет прогресс.
function makeProgress(block, player) {
    var blockTempdata = block.getTempdata();

    var curProgress = blockTempdata.get('progress');
    var newProgress = curProgress + progressCountByInteract;
    newProgress = (newProgress > 100) ? 100 : newProgress;

    blockTempdata.put('progress', newProgress);

    viewHintForPlayer(block, progressText.replace('{0}', newProgress));
    player.playSound(progressSound, 0.5, 1);

    blockTempdata.put('interactBlocked', true);
    startCooldownInteractTimer(block);
}

// Устанавливает значения по умолчанию.
function setupTempdata(blockTempdata) {
    if (!blockTempdata.has('progress'))
        blockTempdata.put('progress', 0);

    if (!blockTempdata.has('empty'))
        blockTempdata.put('empty', false);

    if (!blockTempdata.has('interactBlocked'))
        blockTempdata.put('interactBlocked', false);
}

// Проверяет, является ли жила пустой.
function isEmpty(blockTempdata) {
    return blockTempdata.get('empty');
}

// Проверяет, заблокировано ли взаимодействие.
function isInteractBlocked(blockTempdata) {
    return blockTempdata.get('interactBlocked');
}

// Проверяет, разрешён ли инструмент.
function isInstrumentAllowed(instrument) {
    for (var i = 0; i < allowedInstruments.length; i++)
        if (allowedInstruments[i] == instrument)
            return true;

    return false;
}

// Показывает подсказку на экране игрока.
function viewHintForPlayer(block, text) {
    block.executeCommand('/title @p actionbar {"text":"' + text + '"}');
}

// Выдаёт предмет руды игроку.
function giveOreItem(block) {
    block.executeCommand('/give @p ' + oreItem.id + ' ' + oreItem.count);
}

// Наносит урон инструменту.
function damageInstrument(player, instrument) {
    var curDamage = instrument.getDamage();
    var maxDamage = instrument.getMaxDamage();

    var newDamage = curDamage + instrumentDamageByHarvest;
    if (newDamage >= maxDamage) {
        player.playSound(instrumentBreakSound, 0.5, 1);
        player.removeItem(instrument, 1);
        return;
    }

    instrument.setDamage(newDamage);
}

// Запускает таймер восстановления руды.
function startCooldownTimer(block) {
    block.getTimers().forceStart(1, cooldown * 20, false);
}

// Запускает таймер кулдауна между взаимодействиями.
function startCooldownInteractTimer(block) {
    block.getTimers().forceStart(2, interactColdown * 20, false);
}

// Обработчик завершения прогресса.
function onProgressDone(block, player, instrument) {
    var blockTempdata = block.getTempdata();
    blockTempdata.put('progress', 0);
    blockTempdata.put('empty', true);

    giveOreItem(block);
    block.setModel(emptyModel);

    damageInstrument(player, instrument);

    viewHintForPlayer(block, harvestText);

    startCooldownTimer(block);
}

// Обработчик завершения отчёта таймера восстановления руды.
function onCooldownTimerFinished(block) {
    block.setModel(oreModel);
    block.getTempdata().put('empty', false);
}

// Обработчик завершения отчёта таймера между взаимодействиями.
function onCooldownInteractFinished(blockTempdata) {
    blockTempdata.put('interactBlocked', false);
}