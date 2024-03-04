/*
=========== Скрипт нанисения урона по NPC только определённым оружием ===========
Описание:

Данный скрипт работает на Custom NPCs Minecraft 1.12.2. Суть скрипта - нанисение урона по NPC только определённым оружием из списка в настройках.
При этом, если не использовать эти оружия, вы будете наносить очень мало урона по этому NPC. Имеется поддержка MineFantasy Reforged оружия.
Вставьте скрипт в новую вкладку и настройте по своему вкусу.
-----------
Автор скрипта: Kirill "Rimjact" Tolokolnikov

© Rimjact, 2024
==================================================================
*/

// ================== НАСТРОЙКИ ==================
// Различать оружие не по ID, а по NBT тегам - ture/false (проверено с модом MineFantasy Reforged)
var isMineFantasyWeapons = true;

// Список ID (или Material Names) оружия/инструментов, к которым у этого NPC будет уязвимость 
var vulnerabilityToWeapons = [ "silver", "minecraft:diamond_sword" ];

// Множитель уменьшения урона, если не используется оружие/инструменты из списка
var damageReductionMultipler = 1.5;


// ================== ФУНКЦИОНАЛ ==================
var forEach = Array.prototype.forEach;

// Проверяет, имеет ли NPC уязвимость к текущему предмету в руке. Вернёт true если имеет, иначе false.
function isHasVulnerabilityToWeapon(curentItemInHand, npc) {
    // Код разделён для оружия из MineFantasy и прочих так как в первом есть особенности
    if (isMineFantasyWeapons) {
        // получаем NBT теги из предмета
        var nbtTags = curentItemInHand.getItemNbt();
        var tag = nbtTags.getCompound("tag");
        var materialName = tag.getCompound("mf_custom_materials").getString("main_material"); // Получаем имя материала

        for(var i = 0; i < vulnerabilityToWeapons.length; i++)
            if (vulnerabilityToWeapons[i] === materialName)
                return true;

        return false;
    }

    // Если же не нужно проверять по NBT, проверяем по ID
    // Получаем ID
    var itemID = curentItemInHand.getName();

    // Если список содержит этот ID, вернём true, иначе false, когда цикл завершится.
    for(var i = 0; i < vulnerabilityToWeapons.length; i++)
        if (vulnerabilityToWeapons[i] === itemID)
            return true;

    return false;
}

// Основная функция-событие, вызываемая до получении NPC урона
function damaged(event) {
    var source = event.source,
        npc = event.npc,
        damage = event.damage;

    // Получаем предмет в главной руке игрока
    var curentItemInHand = source.getMainhandItem();

    // Проверяем, если оружие/инструмент в руке находится в списке, то урон не нужно понижать
    if (isHasVulnerabilityToWeapon(curentItemInHand, npc)) return;

    // иначе понижаем урон по NPC
    var reducedDamage = damage * damageReductionMultipler - damage
    event.damage = reducedDamage;
} 