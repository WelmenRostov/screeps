let roleRat = {
    run: function (creep) {

        const targetRoom = "W23N55";      // Комната для атаки
        const healRoom = "W23N56";        // Комната для регенерации
        const targetPos = new RoomPosition(41, 1, targetRoom); // Позиция внутри targetRoom

        // --- Проверяем, нужно ли лечиться ---
        if (creep.hits < creep.hitsMax && creep.memory.state !== "retreat") {
            creep.memory.state = "retreat";
            creep.memory.healTick = 0;
        }

        // --- Состояние: ОТХОД И ЛЕЧЕНИЕ ---
        if (creep.memory.state === "retreat") {

            // Уходим в комнату для лечения
            if (creep.room.name !== healRoom) {
                creep.moveTo(new RoomPosition(25, 25, healRoom), {reusePath: 20});
                return;
            }

            // Внутри healRoom — ждём 5 тиков
            if (creep.memory.healTick === undefined) creep.memory.healTick = 0;
            creep.memory.healTick++;

            creep.say("💤 heal " + creep.memory.healTick);

            if (creep.memory.healTick < 5) return; // ждём 5 тиков

            // После паузы и если HP восстановлено — возвращаемся в атаку
            if (creep.hits === creep.hitsMax) {
                creep.memory.state = "attack";
                creep.memory.healTick = 0;
            } else {
                return; // ждём, пока HP восстановится полностью
            }
        }

        // --- Состояние: АТАКА ---
        if (!creep.memory.state || creep.memory.state === "attack") {

            // Идём в целевую комнату
            if (creep.room.name !== targetRoom) {
                if (creep.hits < creep.hitsMax) {
                    creep.memory.state = "retreat";
                    creep.memory.healTick = 0;
                }
                creep.moveTo(new RoomPosition(25, 25, targetRoom), {reusePath: 20});
                creep.say("➡️");
                return;
            }

            // Стоим на нужной позиции
            if (!creep.pos.isEqualTo(targetPos)) {
                creep.moveTo(targetPos, {range: 0, reusePath: 20});
                creep.say("➡️📍");
                return;
            }

            // --- Пассивная атака: ищем ближайшую цель ---
            let target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (!target) {
                // Если врагов нет — ищем ближайшее строение
                target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                    filter: s => s.structureType !== STRUCTURE_CONTROLLER // не стрелять в контроллер
                });
            }

            // Атакуем цель, если есть
            if (target) {
                if (creep.rangedAttack(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {range: 3});
                }
                creep.say("🎯");
            } else {
                creep.say("❓no target");
            }

            return;
        }
    }
};

module.exports = roleRat;
