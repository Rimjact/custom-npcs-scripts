/*
=========== Скрипт усиления NPC ночью ===========
Описание:

Данный скрипт работает на Custom NPCs Minecraft 1.12.2. Суть скрипта - усиление NPC (увеличение здоровья, скорости, урона) 
на определённое игровое время, как пример, ночью (с 13250 по 22750 тиков). Вставьте скрипт в новую вкладку и настройте по своему вкусу.
-----------
Автор скрипта: Kirill "Rimjact" Tolokolnikov

© Rimjact, 2024
==================================================================
*/

// ================== НАСТРОЙКИ ==================
// Базовые параметры NPC (здоровье, скорость, урон)
var basicsStats = {
    health: 20,
    speed: 5,
    damage: 2
}

// Множители усиления NPC ночью (здоровье, скорость, урон) (базовые параметры умножаются на них)
var gainMultiplers = {
    health: 2,
    speed: 2.5,
    damage: 0.5
}

// Время начала и конца усиления в тиках (игровое время)
var gainTime = {
    start: 13500,
    end: 22500
}


// ================== ФУНКЦИОНАЛ ==================
// Проверяет, переданное время входит в диапазон начала и конца времени усиления? Если входит, вернёт true, иначе false
function isGainTime(time) {
    return gainTime.start <= time && gainTime.end > time; 
}

// Обрабатывает усиление текущего NPC
function gainTimeHandler(npc, world) {
    // Сравниваем текущее время мира с диапазоном усиления
    if (!isGainTime(world.getTime(), npc)) {
        // если не время усиления, выставляем обычные статы
        setNPCStats(npc, basicsStats.speed, basicsStats.health, basicsStats.damage);
        return;
    }

    // если же время усиления пришло и цель обнаружена, выставляем усиление
    var mutlipledSpeed = Math.floor(basicsStats.speed * gainMultiplers.speed),
        multipledHealth = Math.floor(basicsStats.health * gainMultiplers.health),
        multipledDamage = Math.floor(basicsStats.damage * gainMultiplers.damage);

    // Скорость больше 10 установить нельзя
    mutlipledSpeed = mutlipledSpeed > 10 ? 10 : mutlipledSpeed;

    setNPCStats(npc, mutlipledSpeed, multipledHealth, multipledDamage);
}

// Устанавливает скорость, жизни и урон для NPC
function setNPCStats(npc, speed, health, damage) {
    // Выходим на Ai и Stats модули NPC
    var npcAi = npc.getAi();
    var npcStats = npc.getStats();

    // Устанавливаем статы
    npcAi.setWalkingSpeed(speed); // Скорость
    npcStats.setMaxHealth(health); // Жизни
    npcStats.getMelee().setStrength(damage); // Урон
}

// Основная функция-событие, которая срабатывает, когда NPC обнаружит цель
function target(event) {
    gainTimeHandler(event.npc, event.npc.world);
}