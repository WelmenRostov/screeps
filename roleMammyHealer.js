const creepMovement = require('./creepMovement');

let roleMammyHealer = {
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom || 'W24N56';

        // --- Двигаемся в целевую комнату ---
        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 31, targetRoom), {
                reusePath: 20
            });
            return;
        }

        // --- В первую очередь лечим себя ---
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
            return; // пока не восстановим себя — не лечим других
        }

        // --- Ищем повреждённых союзных крипов ---
        let damagedCreeps = creep.room.find(FIND_MY_CREEPS, {
            filter: c => c.hits < c.hitsMax && c !== creep
        });

        if (damagedCreeps.length === 0) {
            // Нет целей — стоим в центре
            let centerPos = new RoomPosition(38, 31, targetRoom);
            if (!creep.pos.isEqualTo(centerPos)) {
                creepMovement.moveTo(creep, centerPos, {
                    reusePath: 10,
                    range: 0
                });
            }
            return;
        }

        // --- Лечим ближайшего союзного крипа ---
        let target = creep.pos.findClosestByRange(damagedCreeps);

        if (target) {
            let range = creep.pos.getRangeTo(target);

            if (range <= 1) {
                creep.heal(target);
            } else if (range <= 3) {
                creep.rangedHeal(target);
            }

            if (range > 1) {
                creepMovement.moveTo(creep, target, {
                    range: 1,
                    reusePath: 5
                });
            }
        }
    }
};

module.exports = roleMammyHealer;
