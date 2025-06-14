/*
=== Скрипт усиления NPC в определённое время ===
ПОРТИРОВАН ИЗ 1.12.2

Описание:

Данный скрипт работает на Custom NPCs Minecraft 1.20.1. Суть скрипта -
усиление NPC (увеличение здоровья, скорости, урона) на определённое игровое 
время, как пример, ночью (с 13250 по 22750 тиков).
Вставьте скрипт в новую вкладку и настройте по своему вкусу.
-----------
Автор скрипта: Kirill "Rimjact" Tolokolnikov

© Rimjact, 2025
==================================
*/

// ==== НАСТРОЙКИ ====
/* Базовые характеристики NPC (целые числа).
- health: здоровье
- damage: урон
- speed: скорость
*/
var baseStats = {
    health: 20,
    damage: 2,
    speed: 5
}

/* Множители характеристик NPC (дробные числа (с точкой)).
- health: здровье
- damage: урон
- speed: скорость
*/
var gainStatsMultiplers = {
    health: 2.0,
    damage: 0.5,
    speed: 2.5,
}

/* Время начала и конца действия усиления (в тиках) (целые числа).
- start: время начала
- end: время конца
*/
var gainTime = {
    start: 13500,
    end: 22500
}


// ==== ФУНКЦИОНАЛ ====
// Модифицируйте код ниже на свой страх и риск

// Обработчик события CustomNPCs API, когда NPC обнаружил цель.
function target(e) {
    onTargetHandler(e.npc)
}

// Проверяет, является ли время требуемым, для усиления.
function isGainTime(curTime) {
    return gainTime.start <= curTime && curTime <= gainTime.end;
}

// Обработчик события обнаружения цели.
function onTargetHandler(npc) {
    var world = npc.getWorld();

    if (!isGainTime(world.getTime())) {
        reduceNPC(npc)
        return
    }

    gainNPC(npc)
}

// Усиливает характеристики NPC.
function gainNPC(npc) {
    var multipledStats = {
        health: Math.floor(baseStats.health * gainStatsMultiplers.health),
        damage: Math.floor(baseStats.damage * gainStatsMultiplers.damage),
        speed: Math.floor(baseStats.speed * gainStatsMultiplers.speed)
    }

    setNPCStats(npc, multipledStats)
}

// Ослабляет характеристики NPC обратно до базовых.
function reduceNPC(npc) {
    setNPCStats(npc, baseStats)
}

// Устанавливает характеристики NPC.
function setNPCStats(npc, stats) {
    var npcStats = npc.getStats();
    npcStats.setMaxHealth(stats.health);
    npcStats.getMelee().setStrength(stats.damage)

    var npcAi = npc.getAi();
    npcAi.setWalkingSpeed(stats.speed);
}