const creepMovement = require('./creepMovement');

let roleSteveNanny = {
    run: function(creep) {

        const homeRoom = creep.memory.homeRoom ||
            (Game.spawns['Steve'] ? Game.spawns['Steve'].room.name : creep.room.name);

        // Возвращение в домашнюю комнату
        if (homeRoom && creep.room.name !== homeRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), { reusePath: 10 });
            return;
        }

        // WORKING STATE
        if (creep.store[RESOURCE_ENERGY] === 0) creep.memory.working = false;
        if (creep.store.getFreeCapacity() === 0) creep.memory.working = true;

        const spawn = Game.spawns['Steve'];

        // ============================================
        // =============== WORKING ====================
        // ============================================
        if (creep.memory.working) {

            // 1. Заполняем спавн
            if (spawn &&
                spawn.store[RESOURCE_ENERGY] < spawn.store.getCapacity(RESOURCE_ENERGY)) {

                if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, spawn, { reusePath: 5 });
                }
                return;
            }

            // 2. Заполняем EXTENSION
            let extensions = creep.room.find(FIND_STRUCTURES, {
                filter: s =>
                    s.structureType === STRUCTURE_EXTENSION &&
                    s.energy < s.energyCapacity
            });

            if (extensions.length > 0) {
                const target = creep.pos.findClosestByPath(extensions);
                if (target) {
                    const res = creep.transfer(target, RESOURCE_ENERGY);
                    if (res === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, target, { reusePath: 5 });
                    }
                }
                return;
            }

            // 3. Заполняем TOWERS <50%
            let towers = creep.room.find(FIND_STRUCTURES, {
                filter: s =>
                    s.structureType === STRUCTURE_TOWER &&
                    s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY) * 0.5
            });

            if (towers.length > 0) {
                const target = creep.pos.findClosestByPath(towers);
                if (target && creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, target, { reusePath: 5 });
                }
                return;
            }

            // 4. Renew (если включено)
            if (spawn &&
                spawn.memory.rejuvenationMode &&
                creep.ticksToLive < 1400 &&
                spawn.store[RESOURCE_ENERGY] > 50) {

                if (creep.pos.getRangeTo(spawn) > 1) {
                    creepMovement.moveTo(creep, spawn, { reusePath: 5, range: 1 });
                } else {
                    spawn.renewCreep(creep);
                }
                return;
            }

            // 5. Idle
            creepMovement.moveTo(creep, new RoomPosition(27, 46, homeRoom), { reusePath: 10 });
            return;
        }

            // ============================================
            // =============== NOT WORKING =================
        // ============================================
        else {

            const nannyReservePositions = [
                new RoomPosition(16, 25, homeRoom),
                new RoomPosition(18, 25, homeRoom),
            ];

            // 1. STORAGE
            const storage = creep.room.storage;

            if (storage && storage.store[RESOURCE_ENERGY] > 0) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storage, { reusePath: 5 });
                }
                return;
            }

            // 2. Reserve containers
            let reserveContainers = nannyReservePositions
                .map(pos =>
                    pos.lookFor(LOOK_STRUCTURES)
                        .find(s => s.structureType === STRUCTURE_CONTAINER &&
                            s.store[RESOURCE_ENERGY] > 1)
                )
                .filter(c => c);

            if (reserveContainers.length > 0) {
                const target = reserveContainers[0];
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, target, { reusePath: 5 });
                }
                return;
            }

            // 3. Idle
            creepMovement.moveTo(creep, new RoomPosition(27, 46, homeRoom), { reusePath: 10 });
        }
    }
};

module.exports = roleSteveNanny;
