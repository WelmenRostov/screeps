const creepMovement = require('./creepMovement');

let roleRemoteHauler = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('📦', creep.pos.x, creep.pos.y - 0.55, {
            align: 'center', font: 0.5, opacity: 1
        });

        const bobSpawn = Game.spawns['Bob'];
        const mammySpawn = Game.spawns['Mammy'];

        if (!bobSpawn || !bobSpawn.room || !bobSpawn.room.storage) return;
        if (!mammySpawn || !mammySpawn.room || !mammySpawn.room.storage) return;

        const bobStorage = bobSpawn.room.storage;
        const mammyStorage = mammySpawn.room.storage;

        const isFull = creep.store.getFreeCapacity() === 0;
        const hasResources = creep.store.getUsedCapacity() > 0;

        // --- Сбор (в Bob) ---
        if (!isFull && !hasResources) {
            if (creep.room.name !== bobStorage.room.name) {
                creepMovement.moveTo(creep, bobStorage.pos, { reusePath: 15 });
                return;
            }

            // Ищем любой ресурс, кроме энергии, если есть
            let resourceType = Object.keys(bobStorage.store)
                .find(res => res !== RESOURCE_ENERGY && bobStorage.store[res] > 0);

            // Если нет других ресурсов — всё равно берём энергию
            if (!resourceType && bobStorage.store[RESOURCE_ENERGY] > 0) {
                resourceType = RESOURCE_ENERGY;
            }

            if (resourceType) {
                if (creep.withdraw(bobStorage, resourceType) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, bobStorage, { reusePath: 5 });
                }
                return;
            }

            // Если ничего нет — просто стоим
            return;
        }

        // --- Доставка ВСЕГО в MammyStorage ---
        if (hasResources) {

            if (creep.room.name !== mammyStorage.room.name) {
                creepMovement.moveTo(creep, mammyStorage.pos, { reusePath: 15 });
                return;
            }

            if (creep.pos.getRangeTo(mammyStorage) > 1) {
                creepMovement.moveTo(creep, mammyStorage, { reusePath: 5 });
                return;
            }

            // Выгружаем все ресурсы подряд
            for (let res in creep.store) {
                if (creep.store[res] > 0) {
                    creep.transfer(mammyStorage, res);
                }
            }

            return;
        }
    }
};

module.exports = roleRemoteHauler;
